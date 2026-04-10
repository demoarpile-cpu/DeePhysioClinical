const prisma = require('../../config/prisma');
const { Prisma } = require('@prisma/client');
const { getAdapters } = require('../../integrations');

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
