const fs = require('fs');
const baseUrl = 'http://localhost:5000/api';

async function fetchApi(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${baseUrl}${path}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

let resultLog = '';
function log(msg) {
  console.log(msg);
  resultLog += msg + '\n';
}

function printTestResult(moduleName, testName, testType, method, url, requestBody, response, expectedPassCondition) {
  const isPass = expectedPassCondition(response);
  log(`\n--- ${moduleName.toUpperCase()} : ${testName.toUpperCase()} (${testType}) ---`);
  log(`API:\n${method} ${url}`);
  log(`\nREQUEST:\n${requestBody ? JSON.stringify(requestBody, null, 2) : '{}'}`);
  log(`\nRESPONSE:\n${JSON.stringify(response.data || response.error, null, 2)}`);
  log(`\nRESULT:\n${isPass ? 'PASS' : 'FAIL'}`);
  log('--------------------------------------\n');
}

async function runTests() {
  log('Starting QA Backend API Tests...\n');
  const uniqueId = Date.now();
  
  let adminUser = { name: `Admin Test ${uniqueId}`, email: `admin${uniqueId}@test.com`, password: 'password123', role: 'admin' };
  await fetchApi('POST', '/auth/register', adminUser);
  let adminLoginRes = await fetchApi('POST', '/auth/login', { email: adminUser.email, password: adminUser.password });
  let adminToken = adminLoginRes.data?.data?.token || adminLoginRes.data?.token;

  let therapistUser = { name: `Therapist Test ${uniqueId}`, email: `therapist${uniqueId}@test.com`, password: 'password123', role: 'therapist' };
  await fetchApi('POST', '/auth/register', therapistUser);
  let therapistLoginRes = await fetchApi('POST', '/auth/login', { email: therapistUser.email, password: therapistUser.password });
  let therapistId = therapistLoginRes.data?.data?.user?.id || therapistLoginRes.data?.user?.id;
  let therapistToken = therapistLoginRes.data?.data?.token || therapistLoginRes.data?.token;

  // PATIENTS
  let patientId = null;
  let deletePatientId = null;

  const p1Req = { firstName: "John", lastName: "Doe", phone: `999888${uniqueId.toString().slice(-4)}` };
  const p1Res = await fetchApi('POST', '/patients', p1Req, adminToken);
  patientId = p1Res.data?.data?.id;
  printTestResult('PATIENTS', 'Create patient', 'VALID REQUEST', 'POST', '/api/patients', p1Req, p1Res, r => r.status >= 200 && r.status < 300);

  const pDelReq = { firstName: "Delete", lastName: "Me", phone: `999887${uniqueId.toString().slice(-4)}` };
  const pDelRes = await fetchApi('POST', '/patients', pDelReq, adminToken);
  deletePatientId = pDelRes.data?.data?.id;

  const p2Req = { firstName: "Jane", lastName: "Doe", phone: p1Req.phone };
  const p2Res = await fetchApi('POST', '/patients', p2Req, adminToken);
  printTestResult('PATIENTS', 'Duplicate phone/email', 'INVALID REQUEST', 'POST', '/api/patients', p2Req, p2Res, r => r.status === 400 || r.status === 409);

  if (patientId) {
    const p3Req = { address: "123 New Street" };
    const p3Res = await fetchApi('PUT', `/patients/${patientId}`, p3Req, adminToken);
    printTestResult('PATIENTS', 'Update partial fields', 'EDGE CASE', 'PUT', `/api/patients/${patientId}`, p3Req, p3Res, r => r.status === 200);
  }

  if (deletePatientId) {
    const p4Res = await fetchApi('DELETE', `/patients/${deletePatientId}`, null, adminToken);
    printTestResult('PATIENTS', 'Delete patient', 'VALID REQUEST', 'DELETE', `/api/patients/${deletePatientId}`, null, p4Res, r => r.status === 200);
  }

  // SERVICES
  const s1Req = { name: `Physio ${uniqueId}`, duration: 60, price: 150 };
  const s1Res = await fetchApi('POST', '/services', s1Req, adminToken);
  let serviceId = s1Res.data?.data?.id;
  printTestResult('SERVICES', 'Create service', 'VALID REQUEST', 'POST', '/api/services', s1Req, s1Res, r => r.status === 201 || r.status === 200);

  const s2Req = { name: s1Req.name.toLowerCase(), duration: 30, price: 80 };
  const s2Res = await fetchApi('POST', '/services', s2Req, adminToken);
  printTestResult('SERVICES', 'Duplicate name (case-insensitive)', 'INVALID REQUEST', 'POST', '/api/services', s2Req, s2Res, r => r.status === 400 || r.status === 409);

  if (serviceId) {
    const s3Req = { price: 200.00, isActive: false };
    const s3Res = await fetchApi('PUT', `/services/${serviceId}`, s3Req, adminToken);
    printTestResult('SERVICES', 'Update service', 'VALID REQUEST', 'PUT', `/api/services/${serviceId}`, s3Req, s3Res, r => r.status === 200);
  }

  const s4Res = await fetchApi('GET', '/services?activeOnly=true', null, adminToken);
  printTestResult('SERVICES', 'Filter activeOnly=true', 'EDGE CASE', 'GET', '/api/services?activeOnly=true', null, s4Res, r => r.status === 200);

  // APPOINTMENTS
  let appointmentId = null;
  if(patientId && therapistId) {
    const a1Req = { patientId, therapistId, appointmentDate: new Date(Date.now() + 86400000).toISOString() };
    const a1Res = await fetchApi('POST', '/appointments', a1Req, adminToken);
    appointmentId = a1Res.data?.data?.id;
    printTestResult('APPOINTMENTS', 'Create appointment', 'VALID REQUEST', 'POST', '/api/appointments', a1Req, a1Res, r => r.status === 201 || r.status === 200);
  }

  if(patientId) {
    const a2Req = { patientId, therapistId: 999999, appointmentDate: new Date(Date.now() + 86400000).toISOString() };
    const a2Res = await fetchApi('POST', '/appointments', a2Req, adminToken);
    printTestResult('APPOINTMENTS', 'Invalid therapist', 'INVALID REQUEST', 'POST', '/api/appointments', a2Req, a2Res, r => r.status >= 400);
  }

  if (appointmentId) {
    const a3Req = { room: "Room 101" };
    const a3Res = await fetchApi('PUT', `/appointments/${appointmentId}`, a3Req, adminToken);
    printTestResult('APPOINTMENTS', 'Update appointment', 'EDGE CASE', 'PUT', `/api/appointments/${appointmentId}`, a3Req, a3Res, r => r.status === 200);

    const a4ReqVal = { status: 'confirmed' };
    const a4ResVal = await fetchApi('PATCH', `/appointments/${appointmentId}/status`, a4ReqVal, adminToken);
    printTestResult('APPOINTMENTS', 'Status transition (valid)', 'VALID REQUEST', 'PATCH', `/api/appointments/${appointmentId}/status`, a4ReqVal, a4ResVal, r => r.status === 200);

    const a4ReqInv = { status: 'flying' };
    const a4ResInv = await fetchApi('PATCH', `/appointments/${appointmentId}/status`, a4ReqInv, adminToken);
    printTestResult('APPOINTMENTS', 'Status transition (invalid)', 'INVALID REQUEST', 'PATCH', `/api/appointments/${appointmentId}/status`, a4ReqInv, a4ResInv, r => r.status === 400);
  }

  // CLINICAL NOTES
  let clinicalNoteId = null;
  if(patientId && therapistId) {
    const c1Req = { patientId, therapistId, type: "Initial Evaluation", date: new Date().toISOString(), status: "Draft", subjective: "Patient complains of lower back pain." };
    const c1Res = await fetchApi('POST', '/clinical-notes', c1Req, therapistToken);
    clinicalNoteId = c1Res.data?.data?.id;
    printTestResult('CLINICAL NOTES', 'Create Draft note', 'VALID REQUEST', 'POST', '/api/clinical-notes', c1Req, c1Res, r => r.status === 201 || r.status === 200);
  }

  if(patientId && therapistId) {
    const c2Req = { patientId, therapistId, type: "Initial Evaluation", date: new Date().toISOString(), status: "Completed", subjective: "Only subjective" };
    const c2Res = await fetchApi('POST', '/clinical-notes', c2Req, therapistToken);
    printTestResult('CLINICAL NOTES', 'Create Completed note', 'INVALID REQUEST', 'POST', '/api/clinical-notes', c2Req, c2Res, r => r.status >= 400);
  }

  if (clinicalNoteId) {
    const c3Req = { status: "Completed", objective: "ROM is limited", assessment: "Muscle strain", plan: "Physiotherapy 2x week" };
    const c3Res = await fetchApi('PUT', `/clinical-notes/${clinicalNoteId}`, c3Req, therapistToken);
    printTestResult('CLINICAL NOTES', 'Update Draft to Completed', 'VALID REQUEST', 'PUT', `/api/clinical-notes/${clinicalNoteId}`, c3Req, c3Res, r => r.status === 200);
  }

  const invalidUuid = 'not-a-uuid';
  const c4Req = { status: "Completed" };
  const c4Res = await fetchApi('PUT', `/clinical-notes/${invalidUuid}`, c4Req, therapistToken);
  printTestResult('CLINICAL NOTES', 'Invalid UUID', 'INVALID REQUEST', 'PUT', `/api/clinical-notes/${invalidUuid}`, c4Req, c4Res, r => r.status === 400);

  fs.writeFileSync('qa_results_final.txt', resultLog, 'utf8');
}

runTests();
