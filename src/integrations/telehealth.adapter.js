class TelehealthAdapter {
  async createSession({ patientId, hostId }) {
    throw new Error(`Telehealth adapter not implemented for patient ${patientId} host ${hostId}`);
  }
}

class SandboxTelehealthAdapter extends TelehealthAdapter {
  async createSession({ patientId, hostId }) {
    const sessionKey = `th_${Date.now()}`;
    return {
      provider: 'sandbox',
      externalId: sessionKey,
      joinUrl: `https://sandbox-telehealth.local/session/${sessionKey}`,
      patientId,
      hostId
    };
  }
}

module.exports = {
  TelehealthAdapter,
  SandboxTelehealthAdapter
};
