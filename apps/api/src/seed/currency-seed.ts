import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking existing currencies...');
  const existing = await prisma.currency.findMany({ orderBy: { code: 'asc' } });
  console.log('Existing:', JSON.stringify(existing, null, 2));

  // Check if ETB exists
  let etb = existing.find((c) => c.code === 'ETB');
  if (!etb) {
    etb = await prisma.currency.create({
      data: {
        code: 'ETB',
        name: 'Ethiopian Birr',
        symbol: 'Br',
        decimalPlaces: 2,
        locale: 'en-ET',
        isActive: true,
        isDefault: true,
      },
    });
    console.log('Created ETB:', etb.id);
  } else {
    // Ensure it's default
    if (!etb.isDefault) {
      // First unset all defaults
      await prisma.currency.updateMany({ data: { isDefault: false } });
      await prisma.currency.update({ where: { id: etb.id }, data: { isDefault: true } });
      console.log('Set ETB as default');
    }
    console.log('ETB already exists:', etb.id);
  }

  // Check USD
  let usd = existing.find((c) => c.code === 'USD');
  if (!usd) {
    usd = await prisma.currency.create({
      data: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        locale: 'en-US',
        isActive: true,
        isDefault: false,
      },
    });
    console.log('Created USD:', usd.id);
  } else {
    console.log('USD already exists:', usd.id);
  }

  // Final verification
  const final = await prisma.currency.findMany({ orderBy: { code: 'asc' } });
  console.log('Final state:', JSON.stringify(final, null, 2));
  const defaults = final.filter((c) => c.isDefault);
  console.log('Defaults:', defaults.length, defaults.map((d) => d.code));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
