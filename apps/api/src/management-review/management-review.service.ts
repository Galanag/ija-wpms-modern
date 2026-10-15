import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GovernanceService } from '../governance/governance.service';

@Injectable()
export class ManagementReviewService {
  constructor(
    private prisma: PrismaService,
    private governanceService: GovernanceService,
  ) {}

  private async assertYearWritable(userId: number, yearId: number) {
    await this.governanceService.assertYearWritable(userId, 'management_review', yearId);
  }

  private async audit(userId: number, action: string, entity: string, recordId: number | string, oldValue?: any, newValue?: any) {
    await this.governanceService.logAudit({
      userId,
      action,
      entity,
      recordId,
      oldValue,
      newValue,
    });
  }

  private async findReview(reviewId: number) {
    const review = await this.prisma.managementReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException(`Management review ${reviewId} not found`);
    return review;
  }

  /**
   * Server-side closed-year protection: mutations against records belonging to a
   * closed/archived planning year are rejected with 409 regardless of UI state.
   * Historical reads remain allowed.
   */
  private async assertYearExists(yearId: number) {
    const year = await this.prisma.planningYear.findUnique({ where: { id: yearId } });
    if (!year) throw new NotFoundException(`Planning year ${yearId} not found`);
    return year;
  }

  async findAllReviews(params: { yearId?: number; status?: string }) {
    const where: any = {};
    if (params.yearId) where.yearId = params.yearId;
    if (params.status) where.status = params.status;
    return this.prisma.managementReview.findMany({
      where,
      include: {
        PlanningYear: true,
        User: { select: { id: true, username: true, fullName: true } },
        _count: { select: { ReviewFinding: true, ReviewDecision: true, ReviewAction: true } },
      },
      orderBy: { reviewDate: 'desc' },
    });
  }

  async findReviewById(id: number) {
    const review = await this.prisma.managementReview.findUnique({
      where: { id },
      include: {
        PlanningYear: true,
        User: { select: { id: true, username: true, fullName: true } },
        ReviewFinding: { orderBy: { createdAt: 'desc' } },
        ReviewDecision: {
          orderBy: { createdAt: 'desc' },
          include: { User: { select: { id: true, username: true, fullName: true } } },
        },
        ReviewAction: {
          orderBy: { createdAt: 'desc' },
          include: {
            User: { select: { id: true, username: true, fullName: true } },
            OrgUnit: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!review) throw new NotFoundException(`Management review ${id} not found`);
    return review;
  }

  async createReview(userId: number, data: any) {
    const yearId = data.yearId;
    if (!yearId) throw new BadRequestException('yearId is required');
    await this.assertYearExists(yearId);
    await this.assertYearWritable(userId, yearId);

    if (!data.reviewPeriod) throw new BadRequestException('reviewPeriod is required');

    const review = await this.prisma.managementReview.create({
      data: {
        yearId,
        reviewPeriod: data.reviewPeriod,
        reviewDate: data.reviewDate ? new Date(data.reviewDate) : new Date(),
        participants: data.participants ?? [],
        status: data.status ?? 'draft',
        notes: data.notes,
        createdBy: userId,
      },
      include: { PlanningYear: true, User: { select: { id: true, username: true, fullName: true } } },
    });

    await this.audit(userId, 'CREATE', 'ManagementReview', review.id, null, {
      yearId: review.yearId,
      reviewPeriod: review.reviewPeriod,
      status: review.status,
    });
    return review;
  }

  async updateReview(userId: number, id: number, data: any) {
    const review = await this.findReview(id);
    await this.assertYearWritable(userId, review.yearId);

    const updateData: any = { ...data };
    delete updateData.id;
    delete updateData.yearId;
    delete updateData.createdBy;
    if (data.reviewDate) updateData.reviewDate = new Date(data.reviewDate);

    const updated = await this.prisma.managementReview.update({
      where: { id },
      data: updateData,
      include: { PlanningYear: true, User: { select: { id: true, username: true, fullName: true } } },
    });

    await this.audit(userId, 'UPDATE', 'ManagementReview', id, { status: review.status }, {
      status: updated.status,
      reviewPeriod: updated.reviewPeriod,
      notes: updated.notes,
    });
    return updated;
  }

  async addFinding(userId: number, reviewId: number, data: any) {
    const review = await this.findReview(reviewId);
    await this.assertYearWritable(userId, review.yearId);

    if (!data.title) throw new BadRequestException('title is required');

    const finding = await this.prisma.reviewFinding.create({
      data: {
        reviewId,
        title: data.title,
        description: data.description,
        severity: data.severity ?? 'medium',
        category: data.category ?? 'kpi',
        sourceInfo: data.sourceInfo,
        yearId: review.yearId,
      },
      include: { ManagementReview: true, PlanningYear: true },
    });

    await this.audit(userId, 'CREATE', 'ReviewFinding', finding.id, null, {
      reviewId: finding.reviewId,
      severity: finding.severity,
      category: finding.category,
    });
    return finding;
  }

  async addDecision(userId: number, reviewId: number, data: any) {
    const review = await this.findReview(reviewId);
    await this.assertYearWritable(userId, review.yearId);

    const decision = await this.prisma.reviewDecision.create({
      data: {
        reviewId,
        description: data.description,
        decision: data.decision ?? 'approved',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedTo: data.assignedTo,
        status: data.status ?? 'open',
      },
      include: { ManagementReview: true, User: { select: { id: true, username: true, fullName: true } } },
    });

    await this.audit(userId, 'CREATE', 'ReviewDecision', decision.id, null, {
      reviewId: decision.reviewId,
      decision: decision.decision,
      assignedTo: decision.assignedTo,
    });
    return decision;
  }

  async addAction(userId: number, reviewId: number, data: any) {
    const review = await this.findReview(reviewId);
    await this.assertYearWritable(userId, review.yearId);

    if (!data.title) throw new BadRequestException('title is required');

    const action = await this.prisma.reviewAction.create({
      data: {
        reviewId,
        title: data.title,
        description: data.description,
        responsiblePersonId: data.responsiblePersonId,
        responsibleOrgUnitId: data.responsibleOrgUnitId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status ?? 'open',
        followUpStatus: data.followUpStatus,
      },
      include: {
        ManagementReview: true,
        User: { select: { id: true, username: true, fullName: true } },
        OrgUnit: { select: { id: true, name: true } },
      },
    });

    await this.audit(userId, 'CREATE', 'ReviewAction', action.id, null, {
      reviewId: action.reviewId,
      status: action.status,
    });
    return action;
  }

  async updateAction(userId: number, reviewId: number, actionId: number, data: any) {
    const review = await this.findReview(reviewId);
    await this.assertYearWritable(userId, review.yearId);

    const action = await this.prisma.reviewAction.findUnique({ where: { id: actionId } });
    if (!action) throw new NotFoundException(`Review action ${actionId} not found`);
    if (action.reviewId !== reviewId) throw new BadRequestException('Action does not belong to this review');

    const updateData: any = { ...data };
    delete updateData.id;
    delete updateData.reviewId;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    const updated = await this.prisma.reviewAction.update({
      where: { id: actionId },
      data: updateData,
      include: {
        ManagementReview: true,
        User: { select: { id: true, username: true, fullName: true } },
        OrgUnit: { select: { id: true, name: true } },
      },
    });

    await this.audit(userId, 'UPDATE', 'ReviewAction', actionId, { status: action.status }, { status: updated.status });
    return updated;
  }

  async closeReview(userId: number, id: number) {
    const review = await this.findReview(id);
    await this.assertYearWritable(userId, review.yearId);

    if (review.status === 'closed') throw new BadRequestException('Review is already closed');

    const oldStatus = review.status;
    const updated = await this.prisma.managementReview.update({
      where: { id },
      data: { status: 'closed' },
      include: { PlanningYear: true, User: { select: { id: true, username: true, fullName: true } } },
    });

    await this.audit(userId, 'CLOSE', 'ManagementReview', id, { status: oldStatus }, { status: 'closed' });
    return updated;
  }
}
