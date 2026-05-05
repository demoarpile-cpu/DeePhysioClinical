const clinicalHistoryService = require('./clinicalHistory.service');

const getClinicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { sort } = req.query;

    const timeline = await clinicalHistoryService.getClinicalHistory(patientId, sort);

    return res.status(200).json({
      success: true,
      data: timeline
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports = { getClinicalHistory };
