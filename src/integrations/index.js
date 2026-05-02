const { SandboxSmsAdapter, TwilioSmsAdapter } = require('./sms.adapter');
const { SandboxEmailAdapter } = require('./email.adapter');
const { SandboxPaymentAdapter } = require('./payment.adapter');
const { SandboxTelehealthAdapter } = require('./telehealth.adapter');

const getAdapterMode = () => (process.env.PROVIDER_MODE || 'sandbox').toLowerCase();

const getAdapters = () => {
  const mode = getAdapterMode();
  
  // Decide which SMS adapter to use
  let smsAdapter;
  if (process.env.TWILIO_ACCOUNT_SID) {
    smsAdapter = new TwilioSmsAdapter();
  } else {
    smsAdapter = new SandboxSmsAdapter();
  }

  return {
    sms: smsAdapter,
    email: new SandboxEmailAdapter(),
    payment: new SandboxPaymentAdapter(),
    telehealth: new SandboxTelehealthAdapter()
  };
};

module.exports = {
  getAdapterMode,
  getAdapters
};
