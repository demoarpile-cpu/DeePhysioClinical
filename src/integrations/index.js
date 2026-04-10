const { SandboxSmsAdapter } = require('./sms.adapter');
const { SandboxEmailAdapter } = require('./email.adapter');
const { SandboxPaymentAdapter } = require('./payment.adapter');
const { SandboxTelehealthAdapter } = require('./telehealth.adapter');

const getAdapterMode = () => (process.env.PROVIDER_MODE || 'sandbox').toLowerCase();

const getAdapters = () => {
  const mode = getAdapterMode();
  if (mode !== 'sandbox') {
    throw new Error(`Unsupported PROVIDER_MODE "${mode}". Only sandbox is configured.`);
  }
  return {
    sms: new SandboxSmsAdapter(),
    email: new SandboxEmailAdapter(),
    payment: new SandboxPaymentAdapter(),
    telehealth: new SandboxTelehealthAdapter()
  };
};

module.exports = {
  getAdapterMode,
  getAdapters
};
