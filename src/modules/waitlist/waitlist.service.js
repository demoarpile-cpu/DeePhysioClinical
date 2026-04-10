const prisma = require('../../config/prisma');

/**
 * Get all waitlist entries
 * @returns {Promise<Array>} List of waitlist entries
 */
const getAllEntries = async () => {
  return await prisma.waitlist.findMany({
    orderBy: {
      created_at: 'desc'
    }
  });
};

/**
 * Create a new waitlist entry
 * @param {Object} data - Formatted data object
 * @returns {Promise<Object>} Created entry
 */
const createEntry = async (data) => {
  const { 
    firstName,
    lastName,
    service, 
    preferredDate, 
    preferredTime, 
    contactNumber, 
    priority 
  } = data;

  // 1. Phone Normalization (MANDATORY)
  const normalizedPhone = contactNumber.trim();

  // 2. Check if patient already exists (Match by phone)
  let patient = await prisma.patient.findFirst({
    where: { 
      phone: normalizedPhone,
      is_deleted: false 
    }
  });

  // 3. IF patient doesn't exist, create one
  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: normalizedPhone,
        patient_type: 'Normal',
        behaviour: 'green'
      }
    });
  }

  // 4. Create Waitlist Entry with patient relation
  return await prisma.waitlist.create({
    data: {
      patient_id: patient.id,
      first_name: firstName,
      last_name: lastName,
      service: service,
      preferred_date: preferredDate ? new Date(preferredDate) : null,
      preferred_time: preferredTime || null,
      contact_number: normalizedPhone,
      priority: priority || 'MEDIUM',
      status: 'WAITING'
    }
  });
};


/**
 * Delete a waitlist entry by ID
 * @param {number} id - The ID of the entry to delete
 * @returns {Promise<Object>} Deleted entry
 */
const deleteEntry = async (id) => {
  // Check existence
  const existingEntry = await prisma.waitlist.findUnique({
    where: { id: parseInt(id, 10) }
  });

  if (!existingEntry) {
    const error = new Error('Waitlist entry not found');
    error.statusCode = 404;
    throw error;
  }

  return await prisma.waitlist.delete({
    where: { id: parseInt(id, 10) }
  });
};

/**
 * Convert a waitlist entry to an appointment
 * @param {number} waitlistId - ID of the waitlist entry
 * @param {Object} conversionData - Data from the frontend (therapistId, appointmentDate, etc.)
 * @returns {Promise<Object>} Created appointment
 */
const convertToAppointment = async (waitlistId, conversionData) => {
  const { therapistId, appointmentDate, notes, serviceId, room, startTime, endTime } = conversionData;

  return await prisma.$transaction(async (tx) => {
    // 1. Find waitlist entry
    const waitlistEntry = await tx.waitlist.findUnique({
      where: { id: parseInt(waitlistId, 10) }
    });

    if (!waitlistEntry) {
      const error = new Error('Waitlist entry not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Resolve Patient ID
    let patientId = waitlistEntry.patient_id;

    // Handle legacy/missing patient relationship (Safety)
    if (!patientId) {
      const normalizedPhone = waitlistEntry.contact_number.trim();
      let patient = await tx.patient.findFirst({
        where: { phone: normalizedPhone, is_deleted: false }
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            first_name: waitlistEntry.first_name,
            last_name: waitlistEntry.last_name,
            phone: normalizedPhone,
            patient_type: 'Normal',
            behaviour: 'green'
          }
        });
      }
      patientId = patient.id;
    }

    // 3. Create Appointment
    const appointment = await tx.appointment.create({
      data: {
        patient_id: patientId,
        therapist_id: parseInt(therapistId, 10),
        appointment_date: new Date(appointmentDate),
        service_id: serviceId ? parseInt(serviceId, 10) : null,
        room: room || null,
        notes: notes || waitlistEntry.service, // Changed from requestedService to service
        start_time: startTime ? new Date(startTime) : null,
        end_time: endTime ? new Date(endTime) : null,
        status: 'scheduled'
      }
    });

    // 4. Delete Waitlist Entry
    await tx.waitlist.delete({
      where: { id: waitlistEntry.id }
    });

    return appointment;
  });
};


module.exports = {
  getAllEntries,
  createEntry,
  deleteEntry,
  convertToAppointment
};

