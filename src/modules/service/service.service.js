const prisma = require('../../config/prisma');

const getAllServices = async (filters) => {
  const where = {};

  if (filters.activeOnly === 'true') {
    where.is_active = true;
  }

  const services = await prisma.service.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  return services.map(s => ({
    ...s,
    price: parseFloat(s.price)
  }));
};

const getServiceById = async (id) => {
  const service = await prisma.service.findUnique({
    where: { id }
  });

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  return service;
};

const createService = async (data) => {
  const { name, category, duration, price } = data;
  const trimmedName = name.trim();

  // Check unique name (case-insensitive)
  const existing = await prisma.service.findFirst({
    where: {
      name: trimmedName
    }
  });

  if (existing) {
    const error = new Error('Service with this name already exists');
    error.statusCode = 400;
    throw error;
  }

  return await prisma.service.create({
    data: {
      name: trimmedName,
      category: category || null,
      duration,
      price
    }
  });
};

const updateService = async (id, data) => {
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  const { name, category, duration, price, isActive } = data;

  // Check unique name if changed
  if (name !== undefined) {
    const trimmedName = name.trim();
    const existing = await prisma.service.findFirst({
      where: {
        name: trimmedName,
        NOT: { id }
      }
    });

    if (existing) {
      const error = new Error('Service with this name already exists');
      error.statusCode = 400;
      throw error;
    }
  }

  const updateData = {};
  if (name !== undefined)     updateData.name      = name.trim();
  if (category !== undefined) updateData.category  = category;
  if (duration !== undefined)  updateData.duration   = duration;
  if (price !== undefined)     updateData.price      = price;
  if (isActive !== undefined)  updateData.is_active  = isActive;

  return await prisma.service.update({
    where: { id },
    data: updateData
  });
};

const deleteService = async (id) => {
  const service = await prisma.service.findUnique({ where: { id } });

  if (!service) {
    const error = new Error('Service not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.service.delete({ where: { id } });
  return service;
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
