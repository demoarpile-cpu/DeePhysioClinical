const bodyChartService = require('./bodyChart.service');

const getBodyCharts = async (req, res, next) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    const charts = await bodyChartService.getBodyChartsByPatientId(patientId);
    return res.status(200).json({
      success: true,
      data: charts
    });
  } catch (error) {
    next(error);
  }
};

const updateBodyChart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientId, annotatedImage } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'patientId is required'
      });
    }

    const updated = await bodyChartService.updateBodyChart(id, patientId, { annotatedImage });
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBodyCharts,
  updateBodyChart
};
