const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Master System Restoration: INITIATED ---\n');

  // 1. Get Core Records for Relations
  const patient = await prisma.patient.findFirst({ where: { phone: '07123456789' } });
  if (!patient) {
    console.error('ERROR: Patient Zero (John Doe) not found. Run reseed.js first.');
    process.exit(1);
  }

  // 2. Restore Suppliers
  console.log('Restoring Suppliers...');
  const suppliers = [
    { name: 'MediSupply Global', email: 'sales@medisupply.com', phone: '0800-123-456', category: 'Medical Equipment' },
    { name: 'PhysioPro UK', email: 'orders@physiopro.co.uk', phone: '0207-987-654', category: 'Consumables' }
  ];
  for (const s of suppliers) {
    // Supplier model in schema doesn't have unique constraint on name, but we'll check
    const existing = await prisma.supplier?.findFirst({ where: { name: s.name } });
    if (!existing && prisma.supplier) {
      await prisma.supplier.create({ data: s });
      console.log(`- Created Supplier: ${s.name}`);
    }
  }

  // 3. Restore Inventory Items
  console.log('\nRestoring Inventory...');
  const inventory = [
    { name: 'Kinesio Tape (Black)', category: 'Taping', sku: 'KT-BLK-001', stock_quantity: 45, unit_price: 8.50, reorder_level: 10 },
    { name: 'Resistance Band (Red/Medium)', category: 'Rehab', sku: 'RB-RED-001', stock_quantity: 20, unit_price: 12.00, reorder_level: 5 },
    { name: 'Massage Wax (Unscented)', category: 'Consumables', sku: 'MW-UNS-500', stock_quantity: 12, unit_price: 15.75, reorder_level: 3 }
  ];
  for (const i of inventory) {
    if (prisma.inventoryItem) {
      const existing = await prisma.inventoryItem.findFirst({ where: { name: i.name } });
      if (!existing) {
        await prisma.inventoryItem.create({ data: i });
        console.log(`- Created Item: ${i.name}`);
      }
    }
  }

  // 4. Restore Exercise Library
  console.log('\nRestoring Exercise Library...');
  const exercises = [
    { name: 'Standard Bodyweight Squat', category: 'Legs', instructions: 'Feet shoulder-width apart, lower hips until thighs are parallel to floor.', difficulty: 'Beginner' },
    { name: 'Wall Slides (Scapular)', category: 'Shoulder', instructions: 'Back against wall, slide arms up into Y position while keeping contact.', difficulty: 'Intermediate' },
    { name: 'Dead Bug', category: 'Core', instructions: 'On back, move opposite arm and leg away from center while maintaining lumbar contact.', difficulty: 'Intermediate' }
  ];
  for (const e of exercises) {
    if (prisma.exercise) {
      const existing = await prisma.exercise.findFirst({ where: { name: e.name } });
      if (!existing) {
        await prisma.exercise.create({ data: e });
        console.log(`- Created Exercise: ${e.name}`);
      }
    }
  }

  // 5. Restore Patient History
  console.log('\nRestoring Patient Medical Records...');
  if (prisma.patientMedicalHistory) {
    await prisma.patientMedicalHistory.upsert({
      where: { patient_id: patient.id },
      update: {},
      create: {
        patient_id: patient.id,
        existing_conditions: 'Mild Hypertension, Previous ACL repair (Left)',
        allergies: 'Penicillin',
        chronic_diseases: 'None',
        surgeries: 'ACL Reconstruction (2018)',
        long_term_notes: 'Highly active runner, focus on knee stability.'
      }
    });
    console.log(`- Restored Medical History for: ${patient.first_name} ${patient.last_name}`);
  }

  if (prisma.patientEmergencyContact) {
    await prisma.patientEmergencyContact.create({
      data: {
        patient_id: patient.id,
        name: 'Jane Doe',
        phone: '07999888777',
        relation: 'Spouse'
      }
    });
    console.log(`- Restored Emergency Contact for: ${patient.first_name} ${patient.last_name}`);
  }

  // 6. Restore Billing (Initial Assessment Invoice)
  console.log('\nRestoring Clinical Billing...');
  if (prisma.invoice) {
    const invoice = await prisma.invoice.create({
      data: {
        patient_id: patient.id,
        date: new Date(),
        subtotal: 65.00,
        tax: 0.00,
        total: 65.00,
        status: 'PAID',
        notes: 'Initial Physiotherapy Assessment',
        items: {
          create: [
            { service: 'Physiotherapy Assessment', rate: 65.00, qty: 1 }
          ]
        },
        payments: {
          create: [
            { 
              patient_id: patient.id,
              amount: 65.00,
              date: new Date(),
              method: 'CARD',
              status: 'Paid',
              description: 'Assessment fee'
            }
          ]
        }
      }
    });
    console.log(`- Created Invoice: ${invoice.id} (PAID)`);
  }

  console.log('\n--- System Restoration Complete ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
