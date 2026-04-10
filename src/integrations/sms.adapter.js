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

module.exports = {
  SmsAdapter,
  SandboxSmsAdapter
};
