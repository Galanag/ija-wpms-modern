const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@6.19.0_prisma@6.19.0_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test with kpiId as string (like JSON would parse it)
    const plan = await prisma.kpiPlan.create({
      data: {
        yearId: 1,
        kpiId: '7',  // string instead of number
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
