import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * CurrencyService - manage the Currency catalog.
 *
 * Rules enforced server-side:
 *  - `code` must be uppercase (e.g. ETB, USD) and unique.
 *  - There is exactly ONE default currency at any time (isDefault === true).
 *  - Only active currencies may be selected for new financial records.
 *  - Mutations are audit-logged (entity: 'Currency').
 */
@Injectable()
export class CurrencyService {
  constructor(private prisma: PrismaService) {}

  private static normalizeCode(code: string): string {
    return (code ?? '').trim().toUpperCase();
  }

  /** List all currencies, default/active first. */
  async listCurrencies() {
    return this.prisma.currency.findMany({
      orderBy: [{ isDefault: 'desc' }, { isActive: 'desc' }, { code: 'asc' }],
    });
  }

  /** Get only active currencies (for dropdowns / selection). */
  async listActive() {
    return this.prisma.currency.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { code: 'asc' }],
    });
  }

  /** Get the current default currency. */
  async getDefault() {
    const def = await this.prisma.currency.findFirst({
      where: { isDefault: true },
    });
    if (def) return def;
    // Fallback if none marked default: pick ETB, then first.
    const etb = await this.prisma.currency.findFirst({ where: { code: 'ETB' } });
    if (etb) return etb;
    const first = await this.prisma.currency.findFirst();
    if (first) return first;
    throw new NotFoundException('No currency configured');
  }

  async findById(id: number) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException(`Currency ${id} not found`);
    return currency;
  }

  async create(data: any, userId?: number) {
    const code = CurrencyService.normalizeCode(data.code);
    if (!code) throw new BadRequestException('code is required');
    if (code !== data.code) throw new BadRequestException('code must be uppercase (e.g. ETB, USD)');

    const existing = await this.prisma.currency.findUnique({ where: { code } });
    if (existing) throw new ConflictException(`Currency ${code} already exists`);

    const decPlaces = data.decimalPlaces != null ? Number(data.decimalPlaces) : 2;
    let isDefault = data.isDefault === true;
    if (isDefault) {
      await this.prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const currency = await this.prisma.currency.create({
      data: {
        code,
        name: data.name || code,
        symbol: data.symbol || '',
        decimalPlaces: decPlaces,
        locale: data.locale || 'en-US',
        isActive: data.isActive ?? true,
        isDefault,
      },
    });
    await this.logAudit(userId, 'CREATE', currency.id, null, currency);
    return currency;
  }

  async update(id: number, data: any, userId?: number) {
    const existing = await this.prisma.currency.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Currency ${id} not found`);

    const patch: any = {};
    if (data.code !== undefined) {
      const code = CurrencyService.normalizeCode(data.code);
      if (!code) throw new BadRequestException('code is required');
      if (code !== data.code) throw new BadRequestException('code must be uppercase (e.g. ETB, USD)');
      const conflict = await this.prisma.currency.findFirst({ where: { code, id: { not: id } } });
      if (conflict) throw new ConflictException(`Currency ${code} already exists`);
      patch.code = code;
    }
    if (data.name !== undefined) patch.name = data.name;
    if (data.symbol !== undefined) patch.symbol = data.symbol;
    if (data.decimalPlaces !== undefined) {
      const d = Number(data.decimalPlaces);
      if (Number.isNaN(d) || d < 0 || d > 6) throw new BadRequestException('decimalPlaces must be 0-6');
      patch.decimalPlaces = d;
    }
    if (data.locale !== undefined) patch.locale = data.locale;
    if (data.isActive !== undefined) patch.isActive = data.isActive === true;

    if (data.isDefault === true && !existing.isDefault) {
      await this.prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      patch.isDefault = true;
    } else if (data.isDefault === false) {
      if (existing.isDefault && !data.isDefaultNew) {
        throw new BadRequestException('Cannot unset the default currency; set another currency as default instead');
      }
      patch.isDefault = false;
    }

    const currency = await this.prisma.currency.update({ where: { id }, data: patch });
    await this.logAudit(userId, 'UPDATE', id, existing, currency);
    return currency;
  }
/** Set a specific currency as the system default. */
  async setDefault(id: number, userId?: number) {
    const currency = await this.prisma.currency.findUnique({ where: { id } });
    if (!currency) throw new NotFoundException(`Currency ${id} not found`);
    if (!currency.isActive) throw new BadRequestException('Cannot set an inactive currency as default');

    await this.prisma.currency.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
    const updated = await this.prisma.currency.update({ where: { id }, data: { isDefault: true } });
    await this.logAudit(userId, 'SET_DEFAULT', id, currency, updated);
    return updated;
  }

  /** Archive (deactivate) a currency. The default cannot be archived. */
  async archive(id: number, userId?: number) {
    const existing = await this.prisma.currency.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Currency ${id} not found`);
    if (existing.isDefault) throw new BadRequestException('Cannot archive the default currency');

    const currency = await this.prisma.currency.update({
      where: { id },
      data: { isActive: false, isDefault: false },
    });
    await this.logAudit(userId, 'ARCHIVE', id, existing, currency);
    return currency;
  }

  /** Reactivate an archived currency. A new default can be injected at the same time. */
  async reactivate(id: number, userId?: number) {
    const existing = await this.prisma.currency.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Currency ${id} not found`);
    const currency = await this.prisma.currency.update({
      where: { id },
      data: { isActive: true },
    });
    await this.logAudit(userId, 'REACTIVATE', id, existing, currency);
    return currency;
  }

  private async logAudit(
    userId: number | undefined,
    action: string,
    recordId: number,
    oldValue: any,
    newValue: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: userId ?? null,
          action,
          entity: 'Currency',
          recordId: String(recordId),
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
        },
      });
    } catch {
      // audit logging must never block the mutation
    }
  }
}