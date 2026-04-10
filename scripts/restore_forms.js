const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Restoring standard clinical forms...');

  const forms = [
    {
      name: 'Standard Patient Intake',
      category: 'Patient Intake',
      fields: [
        { id: 'f1', type: 'heading', label: 'Personal Information' },
        { id: 'f2', type: 'short', label: 'Full Name', required: true, placeholder: 'e.g. John Doe' },
        { id: 'f3', type: 'date', label: 'Date of Birth', required: true },
        { id: 'f4', type: 'heading', label: 'Primary Complaint' },
        { id: 'f5', type: 'text', label: 'Reason for Visit', required: true, placeholder: 'Describe your pain or condition...' },
        { id: 'f6', type: 'dropdown', label: 'Pain Intensity (0-10)', options: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] }
      ]
    },
    {
      name: 'Informed Consent for Treatment',
      category: 'Consent',
      fields: [
        { id: 'c1', type: 'heading', label: 'Consent to Physiotherapy Treatment' },
        { id: 'c2', type: 'helper_text', label: 'I understand that physiotherapy may involve physical assessment and treatment techniques...' },
        { id: 'c3', type: 'checkbox', label: 'I agree to the terms and conditions', options: ['I Agree'], required: true },
        { id: 'c4', type: 'signature', label: 'Patient Signature', required: true }
      ]
    }
  ];

  for (const f of forms) {
    const existing = await prisma.formTemplate.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.formTemplate.create({
        data: {
          name: f.name,
          category: f.category,
          fields: f.fields
        }
      });
      console.log(`- Created Form: ${f.name}`);
    } else {
      console.log(`- Skipped (exists): ${f.name}`);
    }
  }

  console.log('\nForms restoration complete.');
}

main()
  .catch(e => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
