const prisma = require('../../config/prisma');

/**
 * Fetches combined clinical history for a patient:
 *  - ClinicalNote (clinical_notes)
 *  - FormSubmission (form_submissions)
 *  - Payment (payments)
 *
 * Returns a unified, sorted timeline array.
 */
const getClinicalHistory = async (patientId, sort = 'desc') => {
  const pid = parseInt(patientId, 10);
  if (isNaN(pid)) {
    const err = new Error('Invalid patient ID');
    err.statusCode = 400;
    throw err;
  }

  // Verify patient exists
  const patient = await prisma.patient.findUnique({ where: { id: pid } });
  if (!patient) {
    const err = new Error('Patient not found');
    err.statusCode = 404;
    throw err;
  }

  // Fetch all three data sources in parallel
  const [notes, formSubmissions, payments] = await Promise.all([
    prisma.clinicalNote.findMany({
      where: { patient_id: pid },
      include: { therapist: { select: { name: true } } },
      orderBy: { date: 'desc' }
    }),
    prisma.formSubmission.findMany({
      where: { patient_id: pid },
      include: { form_template: { select: { name: true, category: true } } },
      orderBy: { created_at: 'desc' }
    }),
    prisma.payment.findMany({
      where: { patient_id: pid },
      orderBy: { date: 'desc' }
    })
  ]);

  // Map notes into unified format
  const noteEntries = notes.map((n) => {
    // Build a description from SOAP fields or dynamic content
    const soapParts = [n.subjective, n.objective, n.assessment, n.plan]
      .filter(Boolean)
      .join(' | ');
    const description = soapParts || 'Clinical note recorded';

    return {
      type: 'note',
      id: n.id,
      title: 'Note Added',
      description,
      date: n.date,
      metadata: {
        noteType: n.type || 'General',
        status: n.status,
        author: n.therapist?.name || 'N/A'
      }
    };
  });

  // Map form submissions into unified format
  const formEntries = formSubmissions.map((f) => {
    const formName =
      f.form_template?.name || 'Form Submission';
    const category = f.form_template?.category || 'Form';

    return {
      type: 'form',
      id: f.id,
      title: 'Form Submitted',
      description: formName,
      date: f.created_at,
      metadata: {
        formName,
        category
      }
    };
  });

  // Map payments into unified format
  const paymentEntries = payments.map((p) => {
    const amount = parseFloat(p.amount || 0);
    const method = p.method || 'Unknown';

    return {
      type: 'payment',
      id: p.id,
      title: 'Payment',
      description: `₹${amount.toFixed(2)} via ${method}`,
      date: p.date,
      metadata: {
        amount,
        method
      }
    };
  });

  // Merge all entries
  const timeline = [...noteEntries, ...formEntries, ...paymentEntries];

  // Sort by date
  const sortOrder = sort === 'asc' ? 1 : -1;
  timeline.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return (dateA - dateB) * sortOrder;
  });

  return timeline;
};

module.exports = { getClinicalHistory };
