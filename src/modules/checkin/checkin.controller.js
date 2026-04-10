const checkinService = require('./checkin.service');

/**
 * Search Appointment
 * Public API (No Auth)
 */
const searchAppointment = async (req, res) => {
  try {
    const { initial, lastName, dob } = req.body;

    const appointment = await checkinService.searchAppointment(
      initial,
      lastName,
      dob
    );

    return res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

/**
 * Mark Appointment as Arrived
 * Public API (No Auth)
 */
const markAsArrived = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const updatedAppointment = await checkinService.markAsArrived(appointmentId);

    return res.status(200).json({
      success: true,
      data: updatedAppointment,
      message: "Patient checked-in successfully"
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

module.exports = {
  searchAppointment,
  markAsArrived
};