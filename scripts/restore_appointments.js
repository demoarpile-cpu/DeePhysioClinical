const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Restoring sample appointments...');

  // 1. Get IDs
  const patients = await prisma.patient.findMany({ take: 3 });
  const services = await prisma.service.findMany({ take: 3 });
  const therapist = await prisma.user.findFirst({ where: { role: 'therapist' } });

  if (patients.length === 0 || services.length === 0 || !therapist) {
    console.log('Error: Missing patients, services, or therapist. Cannot restore appointments.');
    process.exit(1);
  }

  const now = new Date();
  
  // Appointment 1: Today
  const apptDate1 = new Date(now);
  apptDate1.setHours(10, 0, 0, 0);

  // Appointment 2: Tomorrow
  const apptDate2 = new Date(now);
  apptDate2.setDate(now.getDate() + 1);
  apptDate2.setHours(14, 30, 0, 0);

  // Appointment 3: Yesterday (Completed)
  const apptDate3 = new Date(now);
  apptDate3.setDate(now.getDate() - 1);
  apptDate3.setHours(11, 0, 0, 0);

  const appointments = [
    {
      patient_id: patients[0].id,
      therapist_id: therapist.id,
      service_id: services[0].id,
      appointment_date: apptDate1,
      status: 'confirmed',
      room: 'Room 1',
      start_time: apptDate1,
      end_time: new Date(apptDate1.getTime() + 60 * 60000)
    },
    {
      patient_id: patients[1 % patients.length].id,
      therapist_id: therapist.id,
      service_id: services[1 % services.length].id,
      appointment_date: apptDate2,
      status: 'scheduled',
      room: 'Room 2',
      start_time: apptDate2,
      end_time: new Date(apptDate2.getTime() + 30 * 60000)
    },
    {
      patient_id: patients[2 % patients.length].id,
      therapist_id: therapist.id,
      service_id: services[2 % services.length].id,
      appointment_date: apptDate3,
      status: 'completed',
      room: 'Room 1',
      start_time: apptDate3,
      end_time: new Date(apptDate3.getTime() + 45 * 60000)
    }
  ];

  for (const a of appointments) {
    await prisma.appointment.create({ data: a });
    console.log(`Created appointment for patient ${a.patient_id} on ${a.appointment_date}`);
  }

  console.log('Appointments restoration complete.');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
