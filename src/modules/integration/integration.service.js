const prisma = require('../../config/prisma');
const { getIntegrationAdapter } = require('./adapters');
const { encryptConfig, decryptConfig } = require('../../utils/integrationSecrets');

const resolveClinicId = (clinicId) => (clinicId === undefined ? null : clinicId);

const maskBySchema = (schema, source) => {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const masked = { ...(source || {}) };
  for (const field of fields) {
    if (!field?.key) continue;
    if (field.secret && masked[field.key] !== undefined && masked[field.key] !== null && masked[field.key] !== '') {
      masked[field.key] = '********';
    }
  }
  return masked;
};

const formatIntegrationView = (integration, clinicIntegration) => {
  const decryptedCredentials = decryptConfig(clinicIntegration?.encrypted_credentials) || {};
  const credentialsPreview = maskBySchema(integration.config_schema, decryptedCredentials);
  return {
    id: integration.id,
    slug: integration.slug,
    display_name: integration.display_name,
    category: integration.category,
    description: integration.description,
    auth_type: integration.auth_type,
    adapter_key: integration.adapter_key,
    is_active: integration.is_active,
    supports_connect: integration.supports_connect,
    supports_enable: integration.supports_enable,
    config_schema: integration.config_schema,
    clinic_integration: clinicIntegration ? {
      id: clinicIntegration.id,
      clinic_id: clinicIntegration.clinic_id,
      connection_status: clinicIntegration.connection_status,
      is_enabled: clinicIntegration.is_enabled,
      config: clinicIntegration.config || {},
      credentials_preview: credentialsPreview,
      connected_at: clinicIntegration.connected_at,
      disconnected_at: clinicIntegration.disconnected_at,
      last_health_check_at: clinicIntegration.last_health_check_at,
      updated_at: clinicIntegration.updated_at
    } : null
  };
};

const listIntegrations = async ({ clinicId } = {}) => {
  const resolvedClinicId = resolveClinicId(clinicId);
  const integrations = await prisma.integration.findMany({
    orderBy: [{ category: 'asc' }, { display_name: 'asc' }],
    include: {
      clinic_integrations: {
        where: { clinic_id: resolvedClinicId },
        take: 1
      }
    }
  });

  return integrations.map((item) => formatIntegrationView(item, item.clinic_integrations?.[0]));
};

const createIntegration = async (payload) => prisma.integration.create({
  data: {
    slug: payload.slug,
    display_name: payload.displayName,
    category: payload.category,
    description: payload.description || null,
    auth_type: payload.authType,
    config_schema: payload.configSchema || { fields: [] },
    adapter_key: payload.adapterKey || 'generic',
    is_active: payload.isActive ?? true,
    supports_connect: payload.supportsConnect ?? true,
    supports_enable: payload.supportsEnable ?? true
  }
});

const updateIntegration = async (id, payload) => {
  const data = {};
  if (payload.displayName !== undefined) data.display_name = payload.displayName;
  if (payload.category !== undefined) data.category = payload.category;
  if (payload.description !== undefined) data.description = payload.description || null;
  if (payload.authType !== undefined) data.auth_type = payload.authType;
  if (payload.configSchema !== undefined) data.config_schema = payload.configSchema;
  if (payload.adapterKey !== undefined) data.adapter_key = payload.adapterKey;
  if (payload.isActive !== undefined) data.is_active = payload.isActive;
  if (payload.supportsConnect !== undefined) data.supports_connect = payload.supportsConnect;
  if (payload.supportsEnable !== undefined) data.supports_enable = payload.supportsEnable;

  return prisma.integration.update({
    where: { id: Number(id) },
    data
  });
};

const connectIntegration = async (integrationId, payload) => {
  const id = Number(integrationId);
  const clinicId = resolveClinicId(payload?.clinicId);
  const integration = await prisma.integration.findUnique({ where: { id } });
  if (!integration || !integration.is_active) {
    const error = new Error('Integration not available');
    error.statusCode = 404;
    throw error;
  }

  const adapter = getIntegrationAdapter(integration.adapter_key);
  const check = await adapter.validateConfig({
    schema: integration.config_schema,
    config: payload?.config || payload?.credentials || {}
  });
  if (!check.ok) {
    const error = new Error(check.errors.join(', ') || 'Invalid integration config');
    error.statusCode = 400;
    throw error;
  }

  const connectResult = await adapter.connect({
    integration,
    config: payload?.config || {},
    credentials: payload?.credentials || {}
  });
  if (!connectResult.ok) {
    const error = new Error(connectResult.message || 'Failed to connect integration');
    error.statusCode = 400;
    throw error;
  }

  await prisma.clinicIntegration.upsert({
    where: {
      clinic_id_integration_id: {
        clinic_id: clinicId,
        integration_id: id
      }
    },
    create: {
      clinic_id: clinicId,
      integration_id: id,
      connection_status: 'CONNECTED',
      is_enabled: true,
      config: payload?.config || {},
      encrypted_credentials: encryptConfig(payload?.credentials || {}),
      connected_at: new Date(),
      meta: { connectedBy: 'admin' }
    },
    update: {
      connection_status: 'CONNECTED',
      is_enabled: true,
      config: payload?.config || {},
      encrypted_credentials: encryptConfig(payload?.credentials || {}),
      connected_at: new Date(),
      disconnected_at: null
    }
  });

  return listIntegrations({ clinicId });
};

const disconnectIntegration = async (integrationId, payload) => {
  const id = Number(integrationId);
  const clinicId = resolveClinicId(payload?.clinicId);
  const existing = await prisma.clinicIntegration.findUnique({
    where: {
      clinic_id_integration_id: {
        clinic_id: clinicId,
        integration_id: id
      }
    },
    include: { integration: true }
  });
  if (!existing) {
    const error = new Error('Integration not connected');
    error.statusCode = 404;
    throw error;
  }

  const adapter = getIntegrationAdapter(existing.integration.adapter_key);
  await adapter.disconnect({ integration: existing.integration, config: existing.config || {} });

  await prisma.clinicIntegration.update({
    where: { id: existing.id },
    data: {
      connection_status: 'DISCONNECTED',
      is_enabled: false,
      encrypted_credentials: null,
      disconnected_at: new Date()
    }
  });

  return listIntegrations({ clinicId });
};

const setEnabledState = async (integrationId, enabled, payload) => {
  const id = Number(integrationId);
  const clinicId = resolveClinicId(payload?.clinicId);
  const existing = await prisma.clinicIntegration.findUnique({
    where: {
      clinic_id_integration_id: {
        clinic_id: clinicId,
        integration_id: id
      }
    }
  });
  if (!existing) {
    const error = new Error('Integration must be connected first');
    error.statusCode = 400;
    throw error;
  }
  if (existing.connection_status !== 'CONNECTED' && enabled) {
    const error = new Error('Only connected integrations can be enabled');
    error.statusCode = 400;
    throw error;
  }

  await prisma.clinicIntegration.update({
    where: { id: existing.id },
    data: { is_enabled: Boolean(enabled) }
  });
  return listIntegrations({ clinicId });
};

module.exports = {
  listIntegrations,
  createIntegration,
  updateIntegration,
  connectIntegration,
  disconnectIntegration,
  setEnabledState
};
