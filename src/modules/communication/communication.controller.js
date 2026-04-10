const service = require('./communication.service');

const listThreads = async (req, res) => {
  try {
    const data = await service.listThreads(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const createThread = async (req, res) => {
  try {
    const data = await service.createThread({
      patientId: req.body.patientId,
      channel: req.body.channel || 'sms',
      title: req.body.title,
      createdBy: req.user?.id
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const listMessages = async (req, res) => {
  try {
    const data = await service.listMessages({ threadId: req.params.threadId });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const data = await service.sendMessage({
      threadId: req.params.threadId,
      patientId: req.body.patientId,
      channel: req.body.channel || 'sms',
      subject: req.body.subject,
      body: req.body.body,
      createdBy: req.user?.id
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const createCampaign = async (req, res) => {
  try {
    const data = await service.createCampaign({
      channel: req.body.channel,
      message: req.body.message,
      recipients: req.body.recipients || [],
      createdBy: req.user?.id
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const listCampaigns = async (req, res) => {
  try {
    const data = await service.listCampaigns();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const createTelehealthSession = async (req, res) => {
  try {
    const data = await service.createTelehealthSession({
      patientId: req.body.patientId,
      therapistId: req.body.therapistId || req.user?.id,
      startsAt: req.body.startsAt || null
    });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

const listTelehealthSessions = async (req, res) => {
  try {
    const data = await service.listTelehealthSessions(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

module.exports = {
  listThreads,
  createThread,
  listMessages,
  sendMessage,
  createCampaign,
  listCampaigns,
  createTelehealthSession,
  listTelehealthSessions
};
