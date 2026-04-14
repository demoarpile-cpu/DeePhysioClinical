const prisma = require('../../config/prisma');

/**
 * Get all patients
 * @returns {Array} List of patients
 */
const patientBasicSelect = {
  id: true,
  first_name: true,
  last_name: true,
  phone: true,
  date_of_birth: true,
  patient_type: true,
  behaviour: true,
  therapist_id: true,
  is_active: true
};

const getAllPatients = async (scope = 'read') => {
  return prisma.patient.findMany({
    where: { is_deleted: false },
    ...(scope === 'basic' ? { select: patientBasicSelect } : {}),
    orderBy: { created_at: 'desc' }
  });
};

/**
 * Create a new patient
 * @param {Object} patientData
 * @returns {Object} Created patient
 */
const createPatient = async (patientData) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    gender,
    dateOfBirth,
    address,
    patientType,
    behaviour,
    therapistId,
    emergencyContact
  } = patientData;

  // Check duplicate phone
  const existingPhone = await prisma.patient.findUnique({
    where: { phone }
  });

  if (existingPhone) {
    const error = new Error('Patient with this phone number already exists');
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate email (if provided)
  if (email) {
    const existingEmail = await prisma.patient.findUnique({
      where: { email }
    });

    if (existingEmail) {
      const error = new Error('Patient with this email already exists');
      error.statusCode = 400;
      throw error;
    }
  }

  const emergencyName = String(emergencyContact?.name || '').trim();
  const emergencyPhone = String(emergencyContact?.phone || '').trim();
  const emergencyRelation = String(emergencyContact?.relation || '').trim();

  // Create patient + optional emergency contact atomically
  const patient = await prisma.$transaction(async (tx) => {
    const createdPatient = await tx.patient.create({
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        gender,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address ? address.trim() : null,
        patient_type: patientType || 'Normal',
        behaviour: behaviour || 'green',
        therapist_id: therapistId || null
      }
    });

    if (emergencyName && emergencyPhone) {
      await tx.patientEmergencyContact.create({
        data: {
          patient_id: createdPatient.id,
          name: emergencyName,
          phone: emergencyPhone,
          relation: emergencyRelation || null
        }
      });
    }

    return createdPatient;
  });

  return patient;
};

/**
 * Get patient by ID with related data
 * @param {Number} id - Patient ID
 * @returns {Object} Patient with medical_history and emergency_contacts
 */
const getPatientById = async (id, scope = 'read') => {
  const patient = await prisma.patient.findUnique({
    where: { id, is_deleted: false },
    ...(scope === 'basic'
      ? { select: patientBasicSelect }
      : {
          include: {
            medical_history: true,
            emergency_contacts: true
          }
        })
  });

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return patient;
};

/**
 * Update patient by ID
 * @param {Number} id - Patient ID
 * @param {Object} patientData - Fields to update
 * @returns {Object} Updated patient
 */
const updatePatient = async (id, patientData) => {
  // Check patient exists and is not deleted
  const existing = await prisma.patient.findUnique({
    where: { id, is_deleted: false }
  });

  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    firstName,
    lastName,
    phone,
    email,
    gender,
    dateOfBirth,
    address,
    patientType,
    behaviour,
    therapistId,
    isActive,
    allowSms,
    allowEmail,
    allowNotifications,
    emergencyContact
  } = patientData;

  // Check duplicate phone (exclude current patient)
  if (phone) {
    const existingPhone = await prisma.patient.findFirst({
      where: {
        phone: phone.trim(),
        NOT: { id }
      }
    });

    if (existingPhone) {
      const error = new Error('Phone number already in use by another patient');
      error.statusCode = 400;
      throw error;
    }
  }

  // Check duplicate email (exclude current patient)
  if (email) {
    const existingEmail = await prisma.patient.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        NOT: { id }
      }
    });

    if (existingEmail) {
      const error = new Error('Email already in use by another patient');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate therapist if provided
  if (therapistId !== undefined && therapistId !== null) {
    const therapist = await prisma.user.findUnique({
      where: { id: therapistId }
    });

    if (!therapist || therapist.role !== 'therapist') {
      const error = new Error('Invalid therapist ID');
      error.statusCode = 400;
      throw error;
    }
  }

  // Build update data (only include provided fields)
  const updateData = {};

  if (firstName !== undefined) updateData.first_name = firstName.trim();
  if (lastName !== undefined) updateData.last_name = lastName.trim();
  if (phone !== undefined) updateData.phone = phone.trim();
  if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;
  if (gender !== undefined) updateData.gender = gender;
  if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth ? new Date(dateOfBirth) : null;
  if (address !== undefined) updateData.address = address ? address.trim() : null;
  if (patientType !== undefined) updateData.patient_type = patientType;
  if (behaviour !== undefined) updateData.behaviour = behaviour;
  if (therapistId !== undefined) updateData.therapist_id = therapistId;
  if (isActive !== undefined) updateData.is_active = isActive;
  if (allowSms !== undefined) updateData.allow_sms = allowSms;
  if (allowEmail !== undefined) updateData.allow_email = allowEmail;
  if (allowNotifications !== undefined) updateData.allow_notifications = allowNotifications;

  const emergencyName = String(emergencyContact?.name || '').trim();
  const emergencyPhone = String(emergencyContact?.phone || '').trim();
  const emergencyRelation = String(emergencyContact?.relation || '').trim();

  const patient = await prisma.$transaction(async (tx) => {
    const updatedPatient = await tx.patient.update({
      where: { id },
      data: updateData
    });

    if (emergencyContact !== undefined) {
      const existingPrimary = await tx.patientEmergencyContact.findFirst({
        where: { patient_id: id },
        orderBy: { id: 'asc' }
      });

      if (emergencyName && emergencyPhone) {
        if (existingPrimary) {
          await tx.patientEmergencyContact.update({
            where: { id: existingPrimary.id },
            data: {
              name: emergencyName,
              phone: emergencyPhone,
              relation: emergencyRelation || null
            }
          });
        } else {
          await tx.patientEmergencyContact.create({
            data: {
              patient_id: id,
              name: emergencyName,
              phone: emergencyPhone,
              relation: emergencyRelation || null
            }
          });
        }
      } else if (existingPrimary) {
        // If user clears emergency contact fields, remove the stored primary contact.
        await tx.patientEmergencyContact.delete({ where: { id: existingPrimary.id } });
      }
    }

    return updatedPatient;
  });

  return patient;
};

/**
 * Delete patient by ID
 * @param {Number} id - Patient ID
 * @returns {Object} Deleted patient
 */
const deletePatient = async (id) => {
  // Check patient exists and is not already deleted
  const existing = await prisma.patient.findUnique({
    where: { id, is_deleted: false }
  });

  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Perform Cascade Soft-Delete in a transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Soft delete appointments
    await tx.appointment.updateMany({
      where: { patient_id: id },
      data: { status: 'cancelled' }
    });

    // 2. Clear medical history and emergency contacts (optional, but keep for now)
    // 3. Mark patient as deleted
    return await tx.patient.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    });
  });
};

const getMedicalHistoryByPatientId = async (patientId) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId, is_deleted: false },
    select: { id: true }
  });

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const medicalHistory = await prisma.patientMedicalHistory.findUnique({
    where: { patient_id: patientId }
  });

  return medicalHistory || null;
};

const upsertMedicalHistory = async (patientId, medicalHistoryData) => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId, is_deleted: false },
    select: { id: true }
  });

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    existingConditions,
    allergies,
    chronicDiseases,
    surgeries,
    longTermNotes
  } = medicalHistoryData;

  return await prisma.patientMedicalHistory.upsert({
    where: { patient_id: patientId },
    update: {
      existing_conditions: existingConditions ?? null,
      allergies: allergies ?? null,
      chronic_diseases: chronicDiseases ?? null,
      surgeries: surgeries ?? null,
      long_term_notes: longTermNotes ?? null
    },
    create: {
      patient_id: patientId,
      existing_conditions: existingConditions ?? null,
      allergies: allergies ?? null,
      chronic_diseases: chronicDiseases ?? null,
      surgeries: surgeries ?? null,
      long_term_notes: longTermNotes ?? null
    }
  });
};

module.exports = {
  getAllPatients,
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getMedicalHistoryByPatientId,
  upsertMedicalHistory
};