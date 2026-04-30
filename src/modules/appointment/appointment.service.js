const prisma = require('../../config/prisma');

const createAppointment = async (data) => {
  const { patientId, therapistId, appointmentDate, serviceId, room, startTime, endTime, notes } = data;

  // 1. Check patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check therapist exists and is a therapist
  const therapist = await prisma.user.findUnique({
    where: { id: therapistId }
  });

  if (!therapist || (therapist.role !== 'therapist' && therapist.role !== 'admin')) {
    const error = new Error('Therapist not found or user is not a therapist');
    error.statusCode = 400;
    throw error;
  }

  // 4. Validate date (extra safety)
  const parsedDate = new Date(appointmentDate);
  if (isNaN(parsedDate.getTime())) {
    const error = new Error('Invalid appointment date');
    error.statusCode = 400;
    throw error;
  }

  // 5. Prevent Overlapping or Double Booking (Therapist or Room)
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const existingClash = await prisma.appointment.findFirst({
      where: {
        OR: [
          { therapist_id: therapistId },
          { room: room }
        ],
        status: { notIn: ['cancelled'] },
        AND: [
          { start_time: { lt: end } },
          { end_time: { gt: start } }
        ]
      },
      include: {
        therapist: true
      }
    });

    if (existingClash) {
      const isRoomClash = existingClash.room === room;
      const message = isRoomClash 
        ? `The room "${room}" is already occupied during this time slot.`
        : `The practitioner ${existingClash.therapist.name} is already booked or has an overlapping appointment during this time.`;
      
      const error = new Error(message);
      error.statusCode = 409;
      throw error;
    }
  }

  // 6. Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      patient_id: patientId,
      therapist_id: therapistId,
      appointment_date: parsedDate,
      service_id: serviceId,
      room: room,
      notes: notes,
      start_time: startTime ? new Date(startTime) : null,
      end_time: endTime ? new Date(endTime) : null,
      status: 'scheduled'
    }
  });

  return appointment;
};

const getAllAppointments = async (filters) => {
  const { date, therapistId, patientId, startDate, endDate } = filters;

  const where = {};

  // Date Range Filter (Precedence)
  if (startDate && endDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);

    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      where.appointment_date = {
        gte: s,
        lte: e
      };
    }
  } 
  // Single Date Filter
  else if (date) {
    const s = new Date(date);
    s.setHours(0, 0, 0, 0);
    const e = new Date(date);
    e.setHours(23, 59, 59, 999);

    if (!isNaN(s.getTime())) {
      where.appointment_date = {
        gte: s,
        lte: e
      };
    }
  }

  if (therapistId) {
    where.therapist_id = parseInt(therapistId, 10);
  }

  if (patientId) {
    where.patient_id = parseInt(patientId, 10);
  }

  // Keep deleted patients out, but include all appointment statuses (including cancelled)
  where.patient = { is_deleted: false };

  return await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      therapist: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true } }
    },
    orderBy: {
      appointment_date: 'asc'
    }
  });
};

const getAppointmentById = async (id) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      therapist: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true } }
    }
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  return appointment;
};

const updateAppointment = async (id, data) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const { appointmentDate, therapistId, serviceId, room, startTime, endTime, notes, status } = data;
  const normalizedStatus = status === undefined
    ? undefined
    : (String(status).toLowerCase() === 'confirmed' ? 'scheduled' : String(status).toLowerCase());

  if (therapistId !== undefined) {
    const therapist = await prisma.user.findUnique({ where: { id: therapistId } });
    if (!therapist || therapist.role !== 'therapist') {
      const error = new Error('Invalid therapist ID');
      error.statusCode = 400;
      throw error;
    }
  }

  if (serviceId !== undefined) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      const error = new Error('Service not found');
      error.statusCode = 400;
      throw error;
    }
  }

  if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
    const error = new Error('End time must be after start time');
    error.statusCode = 400;
    throw error;
  }

  const updateData = {};
  if (appointmentDate !== undefined) {
    const parsed = new Date(appointmentDate);
    if (isNaN(parsed.getTime())) {
      const error = new Error('Invalid appointment date');
      error.statusCode = 400;
      throw error;
    }
    updateData.appointment_date = parsed;
  }
  if (therapistId !== undefined) updateData.therapist_id = therapistId;
  if (serviceId !== undefined) updateData.service_id = serviceId;
  if (normalizedStatus !== undefined) updateData.status = normalizedStatus;
  if (room !== undefined) updateData.room = room;
  if (startTime !== undefined) updateData.start_time = startTime ? new Date(startTime) : null;
  if (endTime !== undefined) updateData.end_time = endTime ? new Date(endTime) : null;
  if (notes !== undefined) updateData.notes = notes;
  if (normalizedStatus === 'checked_in') {
    updateData.checked_in_at = new Date();
  }

  return await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      therapist: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true } }
    }
  });
};

const deleteAppointment = async (id) => {
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.appointment.delete({ where: { id } });
  return appointment;
};

const updateAppointmentStatus = async (id, rawStatus) => {
  const status = String(rawStatus || '').toLowerCase() === 'confirmed'
    ? 'scheduled'
    : String(rawStatus || '').toLowerCase();
  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const updateData = { status };
  if (status === 'checked_in') {
    updateData.checked_in_at = new Date();
  }

  return await prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: { select: { id: true, first_name: true, last_name: true } },
      therapist: { select: { id: true, name: true } },
      service: { select: { id: true, name: true, price: true } }
    }
  });
};

const getPractitionersForScheduling = async () => {
  return prisma.user.findMany({
    where: {
      role: { in: ['therapist', 'admin'] }
    },
    select: {
      id: true,
      name: true,
      role: true
    },
    orderBy: {
      name: 'asc'
    }
  });
};

module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  getPractitionersForScheduling
};