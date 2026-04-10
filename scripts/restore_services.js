const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Restoring default services...');

  const services = [
    { name: 'Physiotherapy Assessment', category: 'Physiotherapy', duration: 60, price: 65.00 },
    { name: 'Physiotherapy Follow-up', category: 'Physiotherapy', duration: 30, price: 45.00 },
    { name: 'Sports Massage', category: 'Massage', duration: 45, price: 55.00 },
    { name: 'Initial Consultation', category: 'General', duration: 60, price: 70.00 },
    { name: 'Dry Needling / Acupuncture', category: 'Specialist', duration: 30, price: 40.00 },
    { name: 'Rehabilitation Session', category: 'Exercise', duration: 45, price: 50.00 }
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { id: 0 }, // Dummy id for upsert logic, better to find by name
      create: s,
      update: s,
    });
  }

  // Better approach: find first by name to avoid duplicates if they exist now
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
      console.log(`Created: ${s.name}`);
    } else {
      console.log(`Skipped (already exists): ${s.name}`);
    }
  }

  console.log('Services restoration complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
