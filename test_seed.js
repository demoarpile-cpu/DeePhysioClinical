const { seedTemplates, getAllTemplates } = require('./src/modules/formTemplate/formTemplate.service');

async function debugTemplates() {
  try {
    console.log('Testing seedTemplates...');
    await seedTemplates();
    console.log('Seed check successful.');

    console.log('Testing getAllTemplates...');
    const results = await getAllTemplates();
    console.log('Found templates:', results.length);
    process.exit(0);
  } catch (error) {
    console.error('DEBUG ERROR:', error);
    process.exit(1);
  }
}

debugTemplates();
