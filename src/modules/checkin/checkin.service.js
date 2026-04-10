const prisma = require('../../config/prisma');

/**
 * Search for an appointment based on patient details
 */
const searchAppointment = async (initial, lastName, dob) => {
  const dobStart = new Date(dob);
  dobStart.setHours(0, 0, 0, 0);

  const dobEnd = new Date(dob);
  dobEnd.setHours(23, 59, 59, 999);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const appointment = await prisma.appointment.findFirst({
    where: {
      status: 'scheduled',
      appointment_date: {
        gte: startOfDay,
        lte: endOfDay
      },
      patient: {
        first_name: {
          startsWith: initial
        },
        last_name: {
          contains: lastName
        },
        date_of_birth: {
          gte: dobStart,
          lte: dobEnd
        }
      }
    },
    include: {
      patient: true,
      therapist: { select: { id: true, name: true } }
    }
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  return appointment;
};

/**
 * Mark appointment as arrived
 */
const markAsArrived = async (appointment_id) => {
  const id = parseInt(appointment_id, 10);

  const appointment = await prisma.appointment.findUnique({
    where: { id }
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (appointment.status !== 'scheduled') {
    const error = new Error('Appointment cannot be checked-in');
    error.statusCode = 400;
    throw error;
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: 'checked_in',
      checked_in_at: new Date()
    },
    include: {
      patient: true
    }
  });

  return updatedAppointment;
};

module.exports = {
  searchAppointment,
  markAsArrived
};