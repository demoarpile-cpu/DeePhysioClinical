class EmailAdapter {
  async sendEmail({ to, subject, body }) {
    throw new Error(`Email adapter not implemented for ${to}: ${subject || body?.slice(0, 20) || ''}`);
  }
}

class SandboxEmailAdapter extends EmailAdapter {
  async sendEmail({ to, subject, body }) {
    return {
      provider: 'sandbox',
      externalId: `email_${Date.now()}`,
      status: 'QUEUED',
      to,
      subject: subject || '(no-subject)',
      preview: body?.slice(0, 160) || ''
    };
  }
}

module.exports = {
  EmailAdapter,
  SandboxEmailAdapter
};
