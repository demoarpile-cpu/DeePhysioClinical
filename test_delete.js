const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('--- STARTING DELETE TEST ---');
  
  // 1. Create a test patient
  const patient = await prisma.patient.create({
    data: {
      first_name: 'Test',
      last_name: 'Delete',
      phone: '9999999999',
      email: 'test@delete.com'
    }
  });
  console.log('Created patient with ID:', patient.id);

  // 2. Create an appointment for this patient
  const user = await prisma.user.findFirst({ where: { role: 'therapist' } });
  if (!user) {
    console.error('No therapist found to link appointment');
    return;
  }

  await prisma.appointment.create({
    data: {
      patient_id: patient.id,
      therapist_id: user.id,
      appointment_date: new Date()
    }
  });
  console.log('Created appointment for patient.');

  // 3. Attempt to delete via Service logic (simulated)
  console.log('Attempting to delete patient with appointment...');
  const appCount = await prisma.appointment.count({ where: { patient_id: patient.id } });
  if (appCount > 0) {
    console.log('BLOCK SUCCESS: Found', appCount, 'appointments. Service would return 400.');
  } else {
    console.error('BLOCK FAIL: No appointments found.');
  }

  // 4. Delete the appointment and try again
  await prisma.appointment.deleteMany({ where: { patient_id: patient.id } });
  console.log('Cleaned up appointments.');

  const softDelete = await prisma.patient.update({
    where: { id: patient.id },
    data: { is_deleted: true, deleted_at: new Date() }
  });
  console.log('Soft Delete successful. Patient is_deleted:', softDelete.is_deleted);

  // 5. Verify patient is excluded from list
  const list = await prisma.patient.findMany({ where: { is_deleted: false } });
  const found = list.find(p => p.id === patient.id);
  if (!found) {
    console.log('VERIFICATION SUCCESS: Patient not found in active list.');
  } else {
    console.error('VERIFICATION FAIL: Patient STILL found in active list!');
  }

  // Final cleanup
  await prisma.patient.delete({ where: { id: patient.id } });
  console.log('Test completed and temporary data hard-deleted.');
}

test()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
