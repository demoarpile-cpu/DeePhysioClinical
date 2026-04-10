const clinicalNoteService = require('./clinicalNote.service');
const { logActivity } = require('../../utils/activityLogger');

const getAllClinicalNotes = async (req, res) => {
  try {
    const notes = await clinicalNoteService.getAllClinicalNotes(req.query);

    return res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

const getClinicalNoteById = async (req, res) => {
  try {
    const note = await clinicalNoteService.getClinicalNoteById(req.params.id);

    return res.status(200).json({
      success: true,
      data: note
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

const createClinicalNote = async (req, res) => {
  try {
    const note = await clinicalNoteService.createClinicalNote(req.body);

    await logActivity(
      req.user?.id, 
      'CREATE_NOTE', 
      note.id, 
      'ClinicalNote', 
      `Created new note for Patient ID: ${note.patient_id}`,
      { entity: 'ClinicalNote', entityId: note.id, label: note.type }
    );

    return res.status(201).json({
      success: true,
      data: note,
      message: 'Clinical note created successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

const updateClinicalNote = async (req, res) => {
  try {
    const note = await clinicalNoteService.updateClinicalNote(req.params.id, req.body);


    return res.status(200).json({
      success: true,
      data: note,
      message: 'Clinical note updated successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

const deleteClinicalNote = async (req, res) => {
  try {
    const deletedNote = await clinicalNoteService.deleteClinicalNote(req.params.id);

    return res.status(200).json({
      success: true,
      data: deletedNote,
      message: 'Clinical note deleted successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports = {
  getAllClinicalNotes,
  getClinicalNoteById,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote
};
