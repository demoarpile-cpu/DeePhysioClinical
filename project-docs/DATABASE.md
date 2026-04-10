# Database Design (Final)

## Database Name

clinic_management_db

---

## ⚙️ Global Rules

* All tables: snake_case
* Use timestamps: created_at, updated_at
* Use foreign keys
* Use ENUMs for statuses
* Prisma ORM only (no raw SQL)

---

## 🔢 ENUMS

### roles

admin, therapist, receptionist, billing

---

### appointment_status

scheduled, confirmed, checked_in, in_progress, completed, cancelled, no_show

---

### note_status

draft, completed

---

### invoice_status

pending, paid, partially_paid

---

### message_type

sms, email

---

### message_direction

inbound, outbound

---

## 📦 TABLES

---

### 1. users

* id (PK)
* name
* email (unique)
* password
* role (ENUM roles)
* created_at
* updated_at

---

### 2. patients

* id (PK)
* first_name
* last_name
* phone
* email
* address
* medical_history
* emergency_contact
* insurance_info
* created_by (FK → users.id)
* created_at
* updated_at

---

### 3. appointments

* id (PK)
* patient_id (FK → patients.id)
* therapist_id (FK → users.id)
* service (string)
* room (string)
* start_time (datetime)
* end_time (datetime)
* status (ENUM appointment_status)
* checked_in_at (datetime, optional)
* created_by (FK → users.id)
* created_at
* updated_at

---

### 4. waitlist

* id (PK)
* patient_id (FK → patients.id)
* preferred_date
* preferred_time
* notes
* created_at

---

### 5. notes

* id (PK)
* patient_id (FK → patients.id)
* therapist_id (FK → users.id)
* subjective (text)
* objective (text)
* assessment (text)
* plan (text)
* status (ENUM note_status)
* created_at
* updated_at

---

### 6. messages

* id (PK)
* sender_id (FK → users.id)
* receiver_id (FK → patients.id OR users.id)
* type (ENUM message_type)
* direction (ENUM message_direction)
* content (text)
* status (string)
* created_at

---

### 7. invoices

* id (PK)
* patient_id (FK → patients.id)
* appointment_id (FK → appointments.id)
* line_items (JSON)
* subtotal (decimal)
* tax (decimal)
* total_amount (decimal)
* status (ENUM invoice_status)
* created_by (FK → users.id)
* created_at
* updated_at

---

### 8. payments

* id (PK)
* invoice_id (FK → invoices.id)
* amount (decimal)
* method (string)
* created_at

---

### 9. forms

* id (PK)
* title
* type (intake, consent)
* fields (JSON)
* created_at

---

### 10. form_responses

* id (PK)
* form_id (FK → forms.id)
* patient_id (FK → patients.id)
* answers (JSON)
* created_at

---

## 🔗 RELATIONSHIPS

* user (therapist) → appointments
* patient → appointments
* patient → notes
* patient → invoices
* appointment → invoice
* invoice → payments
* form → form_responses

---

## ⚠️ BUSINESS RULES (STRICT)

### Patient

* first_name, last_name, phone → required

---

### Appointment

* must have:

  * patient_id
  * therapist_id
  * service
  * room

* end_time auto-calculated from duration

* status flow:

```txt
scheduled → confirmed → checked_in → in_progress → completed
cancelled / no_show allowed
```

---

### Check-in

* Only scheduled/confirmed appointments can be checked-in
* Sets:

  * status = checked_in
  * checked_in_at timestamp

---

### Waitlist

* can convert to appointment
* must be deleted after conversion

---

### Notes

* only therapist creates
* must include patient_id

---

### Billing

* invoice requires at least 1 line item
* total_amount = subtotal + tax
* tax = 20%

---

### Payments

* must belong to invoice

---

### Communication

* sender_id always logged-in user
* must support inbound + outbound

---

## 📈 INDEXING (PERFORMANCE)

* users.email
* patients.phone
* appointments.start_time
* invoices.status

---

## 🚫 RESTRICTIONS

* therapist_id must be user with role = therapist
* cannot create invoice before appointment completed
* cannot create appointment without patient

---

## 🎯 FINAL NOTE

This database strictly follows:

* frontend UI structure
* backend system design
* business flow

No extra or missing entities.
