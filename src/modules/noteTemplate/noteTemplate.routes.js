const express = require('express');
const router = express.Router();
const prisma = require('../../config/prisma');
const { verifyToken } = require('../auth/auth.middleware');
const { requireActionAccess } = require('../auth/actionAccess.middleware');
const { noteTemplateSchema } = require('./noteTemplate.validation');

// GET all active templates
router.get('/', verifyToken, requireActionAccess('notes.view'), async (req, res, next) => {
  try {
    const templates = await prisma.clinicalNoteTemplate.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
});

// POST to create a new template
router.post('/', verifyToken, requireActionAccess('notes.manage'), async (req, res, next) => {
  try {
    const { error, value } = noteTemplateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details.map(d => d.message).join(', ') 
      });
    }

    const { title, category, content, isCustom } = value;

    const template = await prisma.clinicalNoteTemplate.create({
      data: {
        title,
        category,
        content: typeof content === 'object' ? JSON.stringify(content) : content,
        isCustom: isCustom !== undefined ? isCustom : true
      }
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// PUT to update an existing template
router.put('/:id', verifyToken, requireActionAccess('notes.manage'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid template ID' });

    const { error, value } = noteTemplateSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: error.details.map(d => d.message).join(', ') 
      });
    }

    const { title, category, content, isCustom } = value;

    const template = await prisma.clinicalNoteTemplate.update({
      where: { id },
      data: {
        title,
        category,
        content: typeof content === 'object' ? JSON.stringify(content) : content,
        isCustom: isCustom !== undefined ? isCustom : true
      }
    });

    res.json({ success: true, data: template });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: 'Template not found' });
    }
    next(error);
  }
});

// DELETE a template
router.delete('/:id', verifyToken, requireActionAccess('notes.manage'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid ID' });

    await prisma.clinicalNoteTemplate.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    next(error);
  }
});

module.exports = router;
