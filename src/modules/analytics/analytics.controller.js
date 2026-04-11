const analyticsService = require('./analytics.service');

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getOverview(req.user);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

const getActivities = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await analyticsService.fetchActivityLogs(req.user, { page, limit });
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

const getStaffOverview = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const data = await analyticsService.getStaffOverview({ month, year });
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getActivities,
  getStaffOverview
};
