const waitlistService = require('./waitlist.service');

/**
 * Get all waitlist entries
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getWaitlist = async (req, res) => {
  try {
    const entries = await waitlistService.getAllEntries();

    return res.status(200).json({
      success: true,
      data: entries
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create a new waitlist entry
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createWaitlistEntry = async (req, res) => {
  try {
    const entry = await waitlistService.createEntry(req.body);

    return res.status(201).json({
      success: true,
      data: entry,
      message: 'Waitlist entry created successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete waitlist entry by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteWaitlistEntry = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deletedEntry = await waitlistService.deleteEntry(id);

    return res.status(200).json({
      success: true,
      data: deletedEntry,
      message: 'Waitlist entry deleted successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Convert a waitlist entry into an appointment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const convertWaitlistToAppointment = async (req, res) => {
  try {
    const waitlistId = parseInt(req.params.id, 10);
    const appointment = await waitlistService.convertToAppointment(waitlistId, req.body);

    return res.status(200).json({
      success: true,
      data: appointment,
      message: 'Waitlist entry converted to appointment successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getWaitlist,
  createWaitlistEntry,
  deleteWaitlistEntry,
  convertWaitlistToAppointment
};

