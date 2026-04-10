const patientService = require('./patient.service');
const { logActivity } = require('../../utils/activityLogger');

/**
 * Get all patients
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllPatients = async (req, res) => {
  try {
    const scope = req.authz?.effectivePermissions?.includes('patient.read') ? 'read' : 'basic';
    const patients = await patientService.getAllPatients(scope);

    return res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new patient
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createPatient = async (req, res) => {
  try {
    const patient = await patientService.createPatient(req.body);

    await logActivity(
      req.user?.id, 
      'CREATE_PATIENT', 
      patient.id, 
      'Patient', 
      `Added patient: ${patient.first_name} ${patient.last_name}`,
      { entity: 'Patient', entityId: patient.id, label: `${patient.first_name} ${patient.last_name}` }
    );

    return res.status(201).json({
      success: true,
      data: patient,
      message: 'Patient created successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get patient by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getPatientById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const scope = req.authz?.effectivePermissions?.includes('patient.read') ? 'read' : 'basic';
    const patient = await patientService.getPatientById(id, scope);

    return res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update patient by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updatePatient = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const patient = await patientService.updatePatient(id, req.body);
    await logActivity(
      req.user?.id,
      'UPDATE_PATIENT',
      patient.id,
      'Patient',
      `Updated patient: ${patient.first_name} ${patient.last_name}`,
      { action: 'update_patient', entity: 'Patient', entityId: patient.id, label: `${patient.first_name} ${patient.last_name}` }
    );

    return res.status(200).json({
      success: true,
      data: patient,
      message: 'Patient updated successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete patient by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deletePatient = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deletedPatient = await patientService.deletePatient(id);
    await logActivity(
      req.user?.id,
      'UPDATE_PATIENT',
      deletedPatient.id,
      'Patient',
      `Soft deleted patient: ${deletedPatient.first_name} ${deletedPatient.last_name}`,
      { action: 'delete_patient', entity: 'Patient', entityId: deletedPatient.id, label: `${deletedPatient.first_name} ${deletedPatient.last_name}` }
    );

    return res.status(200).json({
      success: true,
      data: deletedPatient,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const getMedicalHistory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const medicalHistory = await patientService.getMedicalHistoryByPatientId(id);

    return res.status(200).json({
      success: true,
      data: medicalHistory
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const upsertMedicalHistory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const medicalHistory = await patientService.upsertMedicalHistory(id, req.body);

    return res.status(200).json({
      success: true,
      data: medicalHistory,
      message: 'Medical history updated successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllPatients,
  createPatient,
  getPatientById,
  updatePatient,
  deletePatient,
  getMedicalHistory,
  upsertMedicalHistory
};
