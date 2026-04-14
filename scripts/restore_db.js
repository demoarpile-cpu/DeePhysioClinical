const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const snapshotPath = path.join(__dirname, '../backups/snapshot_2026-04-11T11-37-51-477Z.json');
  console.log('Reading snapshot from:', snapshotPath);
  
  const rawData = fs.readFileSync(snapshotPath, 'utf8');
  const data = JSON.parse(rawData);

  console.log('Clearing existing data (just in case)...');
  // Order matters for deletion too
  await prisma.invoiceItem.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.clinicalNote.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.waitlist.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.service.deleteMany({});

  console.log('Restoring Services...');
  if (data.service) {
    for (const s of data.service) {
      await prisma.service.create({ data: s });
    }
  }

  console.log('Restoring Users...');
  if (data.user) {
    for (const u of data.user) {
      await prisma.user.create({ data: u });
    }
  }

  console.log('Restoring Patients...');
  if (data.patient) {
    for (const p of data.patient) {
      // Handle date fields
      const formatted = { ...p };
      if (formatted.date_of_birth) formatted.date_of_birth = new Date(formatted.date_of_birth);
      if (formatted.deleted_at) formatted.deleted_at = new Date(formatted.deleted_at);
      if (formatted.created_at) formatted.created_at = new Date(formatted.created_at);
      if (formatted.updated_at) formatted.updated_at = new Date(formatted.updated_at);
      await prisma.patient.create({ data: formatted });
    }
  }

  console.log('Restoring Waitlist...');
  if (data.waitlist) {
    for (const w of data.waitlist) {
      const formatted = { ...w };
      if (formatted.preferred_date) formatted.preferred_date = new Date(formatted.preferred_date);
      if (formatted.created_at) formatted.created_at = new Date(formatted.created_at);
      await prisma.waitlist.create({ data: formatted });
    }
  }

  console.log('Restoring Appointments...');
  if (data.appointment) {
    for (const a of data.appointment) {
      const formatted = { ...a };
      if (formatted.appointment_date) formatted.appointment_date = new Date(formatted.appointment_date);
      if (formatted.checked_in_at) formatted.checked_in_at = new Date(formatted.checked_in_at);
      if (formatted.start_time) formatted.start_time = new Date(formatted.start_time);
      if (formatted.end_time) formatted.end_time = new Date(formatted.end_time);
      if (formatted.created_at) formatted.created_at = new Date(formatted.created_at);
      if (formatted.updated_at) formatted.updated_at = new Date(formatted.updated_at);
      await prisma.appointment.create({ data: formatted });
    }
  }

  console.log('Restoring Clinical Notes...');
  if (data.clinicalNote) {
    for (const cn of data.clinicalNote) {
      const formatted = { ...cn };
      if (formatted.date) formatted.date = new Date(formatted.date);
      if (formatted.created_at) formatted.created_at = new Date(formatted.created_at);
      if (formatted.updated_at) formatted.updated_at = new Date(formatted.updated_at);
      // Remove dynamic_content if it somehow exists in snapshot but not in schema
      delete formatted.dynamic_content;
      await prisma.clinicalNote.create({ data: formatted });
    }
  }

  console.log('Restoring Invoices...');
  if (data.invoice) {
    for (const inv of data.invoice) {
      const formatted = { ...inv };
      if (formatted.date) formatted.date = new Date(formatted.date);
      if (formatted.created_at) formatted.created_at = new Date(formatted.created_at);
      if (formatted.updated_at) formatted.updated_at = new Date(formatted.updated_at);
      await prisma.invoice.create({ data: formatted });
    }
  }

  console.log('Restoration COMPLETE!');
}

main()
  .catch((e) => {
    console.error('Restoration FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
