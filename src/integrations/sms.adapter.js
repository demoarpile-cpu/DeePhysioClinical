class SmsAdapter {
  async sendMessage({ to, body }) {
    throw new Error(`SMS adapter not implemented for ${to}: ${body?.slice(0, 20) || ''}`);
  }
}

class SandboxSmsAdapter extends SmsAdapter {
  async sendMessage({ to, body }) {
    return {
      provider: 'sandbox',
      externalId: `sms_${Date.now()}`,
      status: 'QUEUED',
      to,
      preview: body?.slice(0, 160) || ''
    };
  }
}

class TwilioSmsAdapter extends SmsAdapter {
  constructor() {
    super();
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      this.client = require('twilio')(accountSid, authToken);
    }
  }

  async sendMessage({ to, body }) {
    if (!this.client) {
      console.log(`[TWILIO SIMULATION] SMS to ${to}: ${body}`);
      return {
        provider: 'twilio_simulated',
        externalId: `sim_${Date.now()}`,
        status: 'SIMULATED',
        to,
        preview: body?.slice(0, 160) || ''
      };
    }

    try {
      const message = await this.client.messages.create({
        body: body,
        from: process.env.TWILIO_FROM_NUMBER || 'DeePhysio',
        to: to
      });

      return {
        provider: 'twilio',
        externalId: message.sid,
        status: message.status,
        to: message.to,
        preview: body?.slice(0, 160) || ''
      };
    } catch (error) {
      console.error('Twilio Error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }
}

module.exports = {
  SmsAdapter,
  SandboxSmsAdapter,
  TwilioSmsAdapter
};
