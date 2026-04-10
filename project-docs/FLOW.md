# System Flow (Final)

This document defines strict system behavior.
All modules must follow this flow without exception.

---

## 🔐 1. AUTH FLOW

1. User logs in
2. JWT token generated
3. Token required for all requests
4. User role extracted from token

---

## 👥 2. ROLE-BASED ACCESS (RBAC)

### Admin

* Full access

### Therapist

* Own patients only
* Notes access
* Appointment view
* Messaging

### Receptionist

* Patients + appointments
* Waitlist
* Messaging
* Cannot access notes

### Billing

* Invoices + payments only
* Cannot access clinical or appointment data

---

## 🧑‍⚕️ 3. PATIENT FLOW

1. Receptionist/Admin creates patient
2. Patient stored in DB
3. Patient becomes available for:

   * Appointments
   * Notes
   * Billing

Rules:

* Therapist cannot create patient
* Billing cannot access patients

---

## 📅 4. APPOINTMENT FLOW

1. Create appointment

2. Status = scheduled

3. Can move to:

   * confirmed
   * cancelled

4. Arrival flow:

   * scheduled → checked_in → in_progress → completed

5. Can mark:

   * no_show

Rules:

* Must include:
  patient + therapist + service + room
* end_time auto-calculated
* Only receptionist/admin can create

---

## 🟢 4.1 SELF CHECK-IN FLOW (NEW)

Patient self check-in without staff:

1. Patient enters:

   * First Initial
   * Last Name
   * Date of Birth

2. System:

   * Matches patient record
   * Finds today's scheduled appointment

3. Patient clicks:

   * "Arrive" button

4. System updates:

   * status → checked_in
   * checked_in_at → timestamp

Rules:

* Only scheduled appointments allowed
* DOB must match exactly
* Only same-day appointment returned
* One active appointment per patient

---

## ⏳ 5. WAITLIST FLOW

1. Add patient to waitlist
2. Store preferred date/time
3. Convert to appointment
4. Remove from waitlist after conversion

Rules:

* Cannot exist after conversion
* Must link to patient

---

## 📝 6. CLINICAL NOTES FLOW

1. Therapist selects patient
2. Creates note
3. Status = draft
4. Auto-save occurs
5. Finalize → status = completed

Rules:

* Only therapist allowed
* Must include patient_id

---

## 💬 7. COMMUNICATION FLOW

1. User sends message

2. System stores:

   * sender_id
   * receiver_id
   * type
   * direction

3. Supports:

   * SMS
   * Email
   * Bulk

Rules:

* sender_id always logged-in user
* Must support inbound + outbound

---

## 💰 8. BILLING FLOW

1. Appointment must be completed

2. Create invoice

3. Invoice includes:

   * line_items
   * subtotal
   * tax
   * total

4. Add payment

5. Update invoice status

Rules:

* Cannot create invoice before completion
* Payment linked to invoice

---

## 📄 9. FORMS FLOW

1. Create form
2. Store dynamic fields
3. Patient submits form
4. Store responses

---

## 🔄 10. COMPLETE SYSTEM FLOW

Login
→ Create Patient
→ Create Appointment
→ Patient Self Check-in (optional)
→ Complete Appointment
→ Create Invoice
→ Add Payment

---

## ⚠️ 11. DATA CONSISTENCY RULES

* Patient must exist before appointment
* Appointment must exist before invoice
* Invoice must exist before payment
* Therapist must be valid user

---

## 🚫 12. RESTRICTIONS

* No skipping appointment status flow
* No invoice without appointment
* No note without patient
* No unauthorized access

---

## 🎯 FINAL RULE

If any API or logic violates this flow:
→ It is incorrect and must be rejected
