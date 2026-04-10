const validateConfigBySchema = (schema, values) => {
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  const errors = [];
  for (const field of fields) {
    const key = field?.key;
    if (!key) continue;
    const required = Boolean(field.required);
    const value = values?.[key];
    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label || key} is required`);
    }
  }
  return errors;
};

const genericAdapter = {
  key: 'generic',
  async validateConfig({ schema, config }) {
    const errors = validateConfigBySchema(schema, config || {});
    return { ok: errors.length === 0, errors };
  },
  async connect() {
    return { ok: true, message: 'Connected' };
  },
  async disconnect() {
    return { ok: true, message: 'Disconnected' };
  },
  async healthCheck() {
    return { ok: true };
  }
};

module.exports = genericAdapter;
