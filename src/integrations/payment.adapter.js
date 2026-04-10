class PaymentAdapter {
  async createCharge({ amount, currency, reference }) {
    throw new Error(`Payment adapter not implemented for ${reference || amount}`);
  }
}

class SandboxPaymentAdapter extends PaymentAdapter {
  async createCharge({ amount, currency = 'GBP', reference }) {
    return {
      provider: 'sandbox',
      externalId: `pay_${Date.now()}`,
      status: 'AUTHORIZED',
      amount,
      currency,
      reference: reference || null
    };
  }
}

module.exports = {
  PaymentAdapter,
  SandboxPaymentAdapter
};
