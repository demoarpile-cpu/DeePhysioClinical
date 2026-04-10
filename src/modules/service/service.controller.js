const serviceService = require('./service.service');

const getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices(req.query);

    return res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const getServiceById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const service = await serviceService.getServiceById(id);

    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const createService = async (req, res) => {
  try {
    const service = await serviceService.createService(req.body);

    return res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const updateService = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const service = await serviceService.updateService(id, req.body);

    return res.status(200).json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deletedService = await serviceService.deleteService(id);

    return res.status(200).json({
      success: true,
      data: deletedService,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
