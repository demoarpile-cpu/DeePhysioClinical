const episodeService = require('./episode.service');
const { createEpisodeSchema, endEpisodeSchema } = require('./episode.validation');

const getEpisodes = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'patientId is required' });
    }
    const episodes = await episodeService.getEpisodesByPatientId(patientId);
    res.status(200).json({ success: true, data: episodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createEpisode = async (req, res) => {
  try {
    const { error, value } = createEpisodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const episode = await episodeService.createEpisode(value);
    res.status(201).json({ success: true, data: episode });
  } catch (error) {
    if (error.message === 'Active episode already exists for this patient') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const endEpisode = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = endEpisodeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const episode = await episodeService.endEpisode(id, value.endDate);
    res.status(200).json({ success: true, data: episode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEpisodes,
  createEpisode,
  endEpisode
};
