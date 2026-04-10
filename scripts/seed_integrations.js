const prisma = require('../src/config/prisma');

const DEFAULT_INTEGRATIONS = [
  {
    slug: 'google-calendar',
    display_name: 'Google Calendar',
    category: 'Scheduling',
    description: 'Sync appointments and availability to Google Calendar.',
    auth_type: 'OAUTH2',
    adapter_key: 'generic',
    config_schema: {
      fields: [
        { key: 'clientId', label: 'Client ID', type: 'text', required: true, secret: false },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, secret: true }
      ]
    }
  },
  {
    slug: 'sms-gateway',
    display_name: 'SMS Gateway',
    category: 'Communication',
    description: 'Send appointment reminders and alerts via SMS.',
    auth_type: 'API_KEY',
    adapter_key: 'generic',
    config_schema: {
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true, secret: true },
        { key: 'senderId', label: 'Sender ID', type: 'text', required: true, secret: false }
      ]
    }
  },
  {
    slug: 'email-provider',
    display_name: 'Email Provider',
    category: 'Communication',
    description: 'Send transactional and campaign emails.',
    auth_type: 'TOKEN',
    adapter_key: 'generic',
    config_schema: {
      fields: [
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true, secret: true },
        { key: 'fromEmail', label: 'From Email', type: 'email', required: true, secret: false }
      ]
    }
  },
  {
    slug: 'payment-gateway',
    display_name: 'Payment Gateway',
    category: 'Billing',
    description: 'Process online invoice payments.',
    auth_type: 'API_KEY',
    adapter_key: 'generic',
    config_schema: {
      fields: [
        { key: 'publicKey', label: 'Public Key', type: 'text', required: true, secret: false },
        { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, secret: true }
      ]
    }
  }
];

const run = async () => {
  for (const item of DEFAULT_INTEGRATIONS) {
    await prisma.integration.upsert({
      where: { slug: item.slug },
      update: {
        display_name: item.display_name,
        category: item.category,
        description: item.description,
        auth_type: item.auth_type,
        adapter_key: item.adapter_key,
        config_schema: item.config_schema,
        is_active: true,
        supports_connect: true,
        supports_enable: true
      },
      create: {
        ...item,
        is_active: true,
        supports_connect: true,
        supports_enable: true
      }
    });
  }
  console.log('Integration seed complete.');
};

run()
  .catch((error) => {
    console.error('Failed to seed integrations:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
