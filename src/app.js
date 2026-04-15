const express = require('express');
const cors = require('cors');
const { verifyToken } = require('./modules/auth/auth.middleware');
const { requireModuleAccess } = require('./modules/auth/moduleAccess.middleware');
const app = express();

// Core Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://deephysiosoftware.kiaansoftware.com',
  'https://deephysiosoftware.kiaansoftware.com',
  'https://deephysioclinic.netlify.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '15mb' }));

// 3. ROOT TEST ROUTE
app.get('/', (req, res) => {
  res.send('SERVER OK');
});

// 🔥 Response Transformer (BEFORE routes)
const responseTransformer = require('./utils/responseTransformer');
app.use(responseTransformer);

// Routes
const authRoutes = require('./modules/auth/auth.routes');
app.use('/api/auth', authRoutes);
// Public Configuration Route
app.get('/api/public/config', async (req, res, next) => {
  try {
    const prisma = require('./config/prisma');
    const profile = await prisma.globalSettings.findUnique({ where: { key: 'clinicProfile' } });
    if (!profile) return res.json({ success: true, data: {} });
    return res.json({ success: true, data: { clinicProfile: profile.value } });
  } catch (err) {
    next(err);
  }
});

const testRoutes = require('./modules/test/test.routes');
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

const userRoutes = require('./modules/user/user.routes');
const { getMe } = require('./modules/user/user.controller');
// /me endpoint: any authenticated user can fetch their own profile (no module guard)
app.get('/api/users/me', verifyToken, getMe);
// All other user management routes require Settings module access
app.use('/api/users', verifyToken, requireModuleAccess('Settings'), userRoutes);

const patientRoutes = require('./modules/patient/patient.routes');
app.use('/api/patients', verifyToken, requireModuleAccess('Patients'), patientRoutes);

const checkinRoutes = require('./modules/checkin/checkin.routes');
app.use('/api/checkin', verifyToken, requireModuleAccess('Appointments'), checkinRoutes);

const appointmentRoutes = require('./modules/appointment/appointment.routes');
app.use('/api/appointments', verifyToken, requireModuleAccess('Appointments'), appointmentRoutes);

const waitlistRoutes = require('./modules/waitlist/waitlist.routes');
app.use('/api/waitlist', verifyToken, requireModuleAccess('Appointments'), waitlistRoutes);


const serviceRoutes = require('./modules/service/service.routes');
app.use('/api/services', verifyToken, requireModuleAccess(['Billing', 'Appointments']), serviceRoutes);

const clinicalNoteRoutes = require('./modules/clinicalNote/clinicalNote.routes');
app.use('/api/clinical-notes', verifyToken, requireModuleAccess('Clinical Notes'), clinicalNoteRoutes);

const invoiceRoutes = require('./modules/invoice/invoice.routes');
app.use('/api/invoices', verifyToken, requireModuleAccess('Billing'), invoiceRoutes);

const paymentRoutes = require('./modules/payment/payment.routes');
app.use('/api/payments', verifyToken, requireModuleAccess('Billing'), paymentRoutes);

const formTemplateRoutes = require('./modules/formTemplate/formTemplate.routes');
app.use('/api/form-templates', verifyToken, requireModuleAccess('Forms'), formTemplateRoutes);

const formSubmissionRoutes = require('./modules/formSubmission/formSubmission.routes');
app.use('/api/form-submissions', verifyToken, requireModuleAccess('Forms'), formSubmissionRoutes);

const attachmentRoutes = require('./modules/attachment/attachment.routes');
app.use('/api/attachments', verifyToken, requireModuleAccess('Clinical Notes'), attachmentRoutes);

const taskRoutes = require('./modules/task/task.routes');
app.use('/api/tasks', verifyToken, requireModuleAccess('Patients'), taskRoutes);

const fileRoutes = require('./modules/file/file.routes');
app.use('/api/files', verifyToken, requireModuleAccess('Patients'), fileRoutes);

const bodyChartRoutes = require('./modules/bodyChart/bodyChart.routes');
app.use('/api/body-charts', verifyToken, requireModuleAccess('Patients'), bodyChartRoutes);

const episodeRoutes = require('./modules/episode/episode.routes');
app.use('/api/episodes', verifyToken, requireModuleAccess('Patients'), episodeRoutes);

const analyticsRoutes = require('./modules/analytics/analytics.routes');
app.use('/api/analytics', verifyToken, requireModuleAccess('Analytics'), analyticsRoutes);

const settingsRoutes = require('./modules/settings/settings.routes');
app.use('/api/settings', verifyToken, requireModuleAccess('Settings'), settingsRoutes);

const noteTemplateRoutes = require('./modules/noteTemplate/noteTemplate.routes');
app.use('/api/note-templates', verifyToken, requireModuleAccess('Clinical Notes'), noteTemplateRoutes);

const communicationRoutes = require('./modules/communication/communication.routes');
app.use('/api/communication', verifyToken, requireModuleAccess('Communication'), communicationRoutes);

const integrationRoutes = require('./modules/integration/integration.routes');
app.use('/api/integrations', verifyToken, requireModuleAccess('Settings'), integrationRoutes);

// Error Handler (LAST)
const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

module.exports = app;
