const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INITIAL_TEMPLATES = [
    {
        name: 'Standard SOAP Note',
        category: 'Physiotherapy',
        sections: [
            { title: 'Subjective', placeholder: 'Knee pain, onset, VAS 0-10...' },
            { title: 'Objective', placeholder: 'ROM flexion/extension, palpation...' },
            { title: 'Assessment', placeholder: 'Clinical diagnosis, progress...' },
            { title: 'Plan', placeholder: 'Treatment, HEP, next visit...' }
        ]
    },
    {
        name: 'Initial Assessment',
        category: 'Clinical',
        sections: [
            { title: 'Medical History', placeholder: 'Past surgeries, conditions...' },
            { title: 'Goal Setting', placeholder: 'Patient goals, expected outcomes...' },
            { title: 'Physical Exam', placeholder: 'Specific clinical tests...' }
        ]
    },
    {
        name: 'Post-Op Follow-up',
        category: 'Rehabilitation',
        sections: [
            { title: 'Surgical Status', placeholder: 'Wound healing, protocol stage...' },
            { title: 'Mobility', placeholder: 'Aids used, gait pattern...' }
        ]
    },
    { name: 'Wellness Check', category: 'Prevention', sections: [{ title: 'General Vitals', placeholder: 'HR, BP, etc.' }] },
    { name: 'Sports Massage Report', category: 'Manual Therapy', sections: [{ title: 'Soft Tissue State', placeholder: 'Tension, trigger points...' }] },
    { name: 'Discharge Summary', category: 'Final', sections: [{ title: 'Outcome Measures', placeholder: 'Final scores, recommendations...' }] },
];

const normalizeToNewFormat = (template) => {
    return {
        layouts: template.sections.map((section, index) => ({
            id: `layout_${Date.now()}_${index}`,
            type: 'full',
            fields: [{
                id: `field_${Date.now()}_${index}`,
                type: 'text',
                label: section.title,
                required: false,
                placeholder: section.placeholder,
                options: []
            }]
        }))
    };
};

async function main() {
    console.log('Seeding Note Templates...');

    for (const t of INITIAL_TEMPLATES) {
        // Check if already exists to avoid duplicates
        const existing = await prisma.clinicalNoteTemplate.findFirst({
            where: { title: t.name }
        });

        if (!existing) {
            await prisma.clinicalNoteTemplate.create({
                data: {
                    title: t.name,
                    category: t.category,
                    content: normalizeToNewFormat(t),
                    isCustom: false // Marking as system/default
                }
            });
            console.log(`- Created: ${t.name}`);
        } else {
            console.log(`- Skipped (already exists): ${t.name}`);
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
