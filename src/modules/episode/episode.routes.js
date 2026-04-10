const express = require('express');
const router = express.Router();
const episodeController = require('./episode.controller');
const { verifyToken } = require('../auth/auth.middleware');
const { authorizeRoles } = require('../auth/role.middleware');

router.get('/', verifyToken, authorizeRoles('admin', 'therapist'), episodeController.getEpisodes);
router.post('/', verifyToken, authorizeRoles('admin', 'therapist'), episodeController.createEpisode);
router.put('/:id', verifyToken, authorizeRoles('admin', 'therapist'), episodeController.endEpisode);

module.exports = router;
