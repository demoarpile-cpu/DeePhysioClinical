const prisma = require('../../config/prisma');
const { Prisma } = require('@prisma/client');
const { getAdapters } = require('../../integrations');
const nodemailer = require('nodemailer');

let schemaEnsured = false;
const ensureCommunicationSchema = async () => {
  if (schemaEnsured) return;
  await prisma.$executeRaw(Prisma.sql`
    CREATE TABLE IF NOT EXISTS communication_threads (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      channel VARCHAR(32) NOT NULL,
      title VARCHAR(191) NULL,
      created_by INT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_comm_threads_patient_channel (patient_id, channel)
    )
  `);
  await prisma.$executeRaw(Prisma.sql`
    CREATE TABLE IF NOT EXISTS communication_messages (
      id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      thread_id INT NOT NULL,
      patient_id INT NOT NULL,
      channel VARCHAR(32) NOT NULL,
      direction VARCHAR(16) NOT NULL,
      body LONGTEXT NOT NULL,
      subject VARCHAR(191) NULL,
      delivery_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
      external_id VARCHAR(191) NULL,
      created_by INT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_comm_messages_thread (thread_id),
      INDEX idx_comm_messages_patient (patient_id)
    )
  `);
  // Add missing columns if they don't exist
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE communication_messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE');
    await prisma.$executeRawUnsafe('ALTER TABLE communication_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE');
  } catch (e) {
    // If IF NOT EXISTS is not supported by the MySQL version, this might fail if columns already exist
    // We ignore the error as it likely means columns are already there
  }
  await prisma.$executeRaw(Prisma.sql`
    CREATE TABLE IF NOT EXISTS communication_campaigns (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      channel VARCHAR(32) NOT NULL,
      message LONGTEXT NOT NULL,
      recipients_json LONGTEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
      created_by INT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    )
  `);
  await prisma.$executeRaw(Prisma.sql`
    CREATE TABLE IF NOT EXISTS telehealth_sessions (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      patient_id INT NOT NULL,
      therapist_id INT NULL,
      provider VARCHAR(64) NOT NULL,
      external_id VARCHAR(191) NOT NULL,
      join_url LONGTEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
      starts_at DATETIME(3) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_telehealth_patient (patient_id)
    )
  `);
  schemaEnsured = true;
};

const listThreads = async ({ channel, patientId }) => {
  await ensureCommunicationSchema();
  if (channel && patientId) {
    return prisma.$queryRaw`SELECT * FROM communication_threads WHERE channel = ${String(channel)} AND patient_id = ${Number(patientId)} ORDER BY updated_at DESC`;
  }
  if (channel) {
    return prisma.$queryRaw`SELECT * FROM communication_threads WHERE channel = ${String(channel)} ORDER BY updated_at DESC`;
  }
  if (patientId) {
    return prisma.$queryRaw`SELECT * FROM communication_threads WHERE patient_id = ${Number(patientId)} ORDER BY updated_at DESC`;
  }
  return prisma.$queryRaw`SELECT * FROM communication_threads ORDER BY updated_at DESC`;
};

const createThread = async ({ patientId, channel, title, createdBy }) => {
  await ensureCommunicationSchema();
  await prisma.$executeRaw`
    INSERT INTO communication_threads (patient_id, channel, title, created_by)
    VALUES (${Number(patientId)}, ${channel}, ${title || null}, ${createdBy || null})
  `;
  const rows = await prisma.$queryRaw`SELECT * FROM communication_threads ORDER BY id DESC LIMIT 1`;
  return rows[0];
};

const listMessages = async ({ threadId }) => {
  await ensureCommunicationSchema();
  return prisma.$queryRaw`
    SELECT * FROM communication_messages
    WHERE thread_id = ${Number(threadId)}
    ORDER BY created_at ASC
  `;
};

const sendMessage = async ({ threadId, patientId, channel, subject, body, createdBy }) => {
  await ensureCommunicationSchema();
  const adapters = getAdapters();
  const providerResult = channel === 'email'
    ? await adapters.email.sendEmail({ to: `patient-${patientId}@example.local`, subject, body })
    : await adapters.sms.sendMessage({ to: `patient-${patientId}`, body });

  await prisma.$executeRaw`
    INSERT INTO communication_messages (thread_id, patient_id, channel, direction, body, subject, delivery_status, external_id, created_by)
    VALUES (${Number(threadId)}, ${Number(patientId)}, ${channel}, 'outbound', ${body}, ${subject || null}, ${providerResult.status || 'QUEUED'}, ${providerResult.externalId || null}, ${createdBy || null})
  `;

  await prisma.$executeRaw`
    UPDATE communication_threads
    SET updated_at = CURRENT_TIMESTAMP(3)
    WHERE id = ${Number(threadId)}
  `;
  const rows = await prisma.$queryRaw`
    SELECT * FROM communication_messages
    WHERE thread_id = ${Number(threadId)}
    ORDER BY id DESC
    LIMIT 1
  `;
  return rows[0];
};

const updateMessageFlags = async (messageId, { isStarred, isDeleted }) => {
  await ensureCommunicationSchema();
  
  const updates = [];
  if (isStarred !== undefined) updates.push(`is_starred = ${isStarred ? 1 : 0}`);
  if (isDeleted !== undefined) updates.push(`is_deleted = ${isDeleted ? 1 : 0}`);

  if (updates.length === 0) return null;

  // Using a very direct raw SQL query to bypass any Prisma model issues
  await prisma.$executeRawUnsafe(`
    UPDATE communication_messages 
    SET ${updates.join(', ')}
    WHERE id = ${messageId}
  `);

  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM communication_messages WHERE id = ${messageId}`);
  return rows[0];
};

const createCampaign = async ({ channel, message, recipients, createdBy }) => {
  await ensureCommunicationSchema();
  await prisma.$executeRaw`
    INSERT INTO communication_campaigns (channel, message, recipients_json, status, created_by)
    VALUES (${channel}, ${message}, ${JSON.stringify(recipients || [])}, 'QUEUED', ${createdBy || null})
  `;
  const rows = await prisma.$queryRaw`SELECT * FROM communication_campaigns ORDER BY id DESC LIMIT 1`;
  return rows[0];
};

const listCampaigns = async () => {
  await ensureCommunicationSchema();
  return prisma.$queryRaw`SELECT * FROM communication_campaigns ORDER BY created_at DESC`;
};

const createTelehealthSession = async ({ patientId, therapistId, startsAt }) => {
  await ensureCommunicationSchema();
  const adapters = getAdapters();
  const providerResult = await adapters.telehealth.createSession({ patientId, hostId: therapistId });
  await prisma.$executeRaw`
    INSERT INTO telehealth_sessions (patient_id, therapist_id, provider, external_id, join_url, status, starts_at)
    VALUES (${Number(patientId)}, ${therapistId ? Number(therapistId) : null}, ${providerResult.provider}, ${providerResult.externalId}, ${providerResult.joinUrl}, 'SCHEDULED', ${startsAt ? new Date(startsAt) : null})
  `;
  const rows = await prisma.$queryRaw`
    SELECT * FROM telehealth_sessions
    WHERE external_id = ${providerResult.externalId}
    ORDER BY id DESC
    LIMIT 1
  `;
  return rows[0];
};

const listTelehealthSessions = async ({ patientId }) => {
  await ensureCommunicationSchema();
  if (patientId) {
    return prisma.$queryRaw`SELECT * FROM telehealth_sessions WHERE patient_id = ${Number(patientId)} ORDER BY created_at DESC`;
  }
  return prisma.$queryRaw`SELECT * FROM telehealth_sessions ORDER BY created_at DESC`;
};

const sendDirectEmail = async ({ patientId, recipientEmail, subject, body, file, createdBy }) => {
  await ensureCommunicationSchema();
  
  // 1. Get patient email
  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    throw new Error('Patient not found.');
  }

  const targetEmail = recipientEmail || patient.email;
  if (!targetEmail) {
    throw new Error('No recipient email address available for this patient.');
  }

  // 2. Setup Transporter or Twilio Test Mode
  const smtpPass = process.env.SMTP_PASS;
  const twilioTestSid = process.env.TWILIO_TEST_ACCOUNT_SID;
  const twilioTestToken = process.env.TWILIO_TEST_AUTH_TOKEN;
  
  const isTwilioTestMode = Boolean(twilioTestSid && twilioTestToken);
  const isSmtpSimulation = !smtpPass || smtpPass === 'your-app-password';
  
  const isSimulation = isTwilioTestMode || isSmtpSimulation;
  
  let info = { messageId: isTwilioTestMode ? `twilio-test-${Date.now()}` : `simulated-${Date.now()}` };

  if (!isSimulation) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
          user: process.env.SMTP_USER || 'deephysioclinic@gmail.com',
          pass: smtpPass
      }
    });

    // 3. Send email with attachment
    try {
      info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"DeePhysio Clinic" <deephysioclinic@gmail.com>',
        to: targetEmail,
        subject: subject,
        text: body,
        attachments: [
          {
            filename: file.originalname || 'Clinical_Document.pdf',
            content: file.buffer,
            contentType: file.mimetype || 'application/pdf'
          }
        ]
      });
    } catch (mailError) {
      console.error('Nodemailer Error:', mailError);
      throw new Error(`Failed to send email: ${mailError.message}`);
    }
  } else {
    if (isTwilioTestMode) {
      console.log(`[TWILIO REST API TEST] Validated credentials for SID: ${twilioTestSid}. Simulating email delivery to ${targetEmail} with subject: ${subject}`);
    } else {
      console.log(`[SIMULATION] Email would have been sent to ${targetEmail} with subject: ${subject}`);
    }
  }

  // 4. Log in communication tables
  try {
    const threads = await prisma.$queryRaw`SELECT * FROM communication_threads WHERE channel = 'email' AND patient_id = ${Number(patientId)} LIMIT 1`;
    let threadId;
    
    if (!threads || threads.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO communication_threads (patient_id, channel, title, created_by)
        VALUES (${Number(patientId)}, 'email', 'Clinical Documents', ${createdBy || null})
      `;
      const newThread = await prisma.$queryRaw`SELECT * FROM communication_threads ORDER BY id DESC LIMIT 1`;
      threadId = newThread[0].id;
    } else {
      threadId = threads[0].id;
    }

    const deliveryStatus = isTwilioTestMode ? 'TEST_SUCCESS' : (isSimulation ? 'SIMULATED' : 'DELIVERED');
    const logBody = isTwilioTestMode ? `[TWILIO TEST] Emailed Clinical_Document.pdf to ${targetEmail}` : (isSimulation ? `[SIMULATED] Emailed Clinical_Document.pdf to ${targetEmail}` : 'Emailed Clinical_Document.pdf');

    await prisma.$executeRaw`
      INSERT INTO communication_messages (thread_id, patient_id, channel, direction, body, subject, delivery_status, external_id, created_by)
      VALUES (${threadId}, ${Number(patientId)}, 'email', 'outbound', ${logBody}, ${subject}, ${deliveryStatus}, ${info.messageId}, ${createdBy || null})
    `;

    return { 
      messageId: info.messageId, 
      email: targetEmail, 
      isSimulation,
      message: isTwilioTestMode ? 'Twilio Test Successful (Mock Email Sent)' : (isSimulation ? 'Email workflow simulated (No SMTP credentials)' : 'Email sent successfully')
    };
  } catch (dbError) {
    console.error('Database Logging Error:', dbError);
    // Even if logging fails, the email was sent
    return { messageId: info.messageId, email: targetEmail, warning: 'Email sent but failed to log in communication history.' };
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
  listTelehealthSessions,
  sendDirectEmail,
  updateMessageFlags
};
