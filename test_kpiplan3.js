const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@6.19.0_prisma@6.19.0_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const plan = await prisma.kpiPlan.create({
      data: {
        yearId: 10,
        kpiId: 7,
        approvalStatus: 'draft',
      }
    });
    console.log('Test passed:', plan.id);
    await prisma.kpiPlan.delete({ where: { id: plan.id } });
  } catch (e) {
    console.log('Test failed:', e.message);
  }
}

main().catch(console.error);
