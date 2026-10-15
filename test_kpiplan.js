const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@6.19.0_prisma@6.19.0_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const plan1 = await prisma.kpiPlan.create({
      data: {
        yearId: 10,
        kpiId: 7,
        approvalStatus: 'draft',
      }
    });
    console.log('Test 1 passed:', plan1.id);
    await prisma.kpiPlan.delete({ where: { id: plan1.id } });
  } catch (e) {
    console.log('Test 1 failed:', e.message);
  }
04

  try {
    const plan2 = await prisma.kpiPlan.create({
      data: {
        yearId: 10,
        approvalStatus: 'draft',
        Kpi: { connect: { id: 7 } }
      }
    });
    console.log('Test 2 passed:', plan2.id);
    await prisma.kpiPlan.delete({ where: { id: plan2.id } });
  } catch (e) {
    console.log('Test 2 failed:', e.message);
  }
}

main().catch(console.error);
