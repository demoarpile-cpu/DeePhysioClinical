# 🏥 Project: DeePhysio Clinic Management System

---

## 📌 Project Overview

DeePhysio is a **complete clinic management system** designed for physiotherapy clinics to manage:

* Patients (CRM)
* Appointments & Scheduling
* Clinical Notes (SOAP-based)
* Billing & Payments
* Communication (SMS, Email, Telehealth)
* Forms & Intake
* Analytics & Reporting
* Role-based access system

⚠️ The system must strictly follow frontend UI and workflow (no assumptions allowed).

---

## 👥 User Roles

### 1. Admin

* Full system access
* Manage users, roles, settings
* Access analytics & system configuration

### 2. Therapist

* Manage own patients
* View & manage own appointments
* Create & manage clinical notes
* Cannot access billing or analytics

### 3. Receptionist

* Manage patients & appointments
* Handle waitlist
* Limited billing access (Invoices only)
* Cannot access clinical notes

### 4. Billing Staff

* Manage invoices, payments, claims
* Financial dashboard only
* Cannot access clinical or appointment modules

---

## 🧩 Core Modules

### 1. Authentication

* Login with role selection
* JWT-based authentication
* Session handling

---

### 2. Dashboard

* Role-based dashboard data
* Therapist → own data only
* Billing → financial data only
* Receptionist → limited stats

---

### 3. Patients (CRM)

* Create, update, delete patients
* Emergency contact (conditional)
* Medical history
* Visit history tracking

---

### 4. Appointments

* Book appointment
* Availability & time blocks
* Waitlist management
* Appointment lifecycle tracking

---

### 4.1 Self Check-in (NEW FEATURE)

Patients can check-in themselves without staff assistance.

#### 🔹 Flow

* Patient enters:

  * First Initial
  * Last Name
  * Date of Birth

* System:

  * Matches patient record
  * Finds scheduled appointment (same-day)

* Patient clicks:

  * "Arrive" button

* System updates:

  * Appointment status → **Arrived (checked_in)**
  * `checked_in_at` timestamp is recorded

---

#### 🔹 Rules

* Only scheduled/confirmed appointments can be checked-in
* DOB must match exactly
* Only same-day appointments should be returned
* Only one active appointment per patient allowed
* Check-in can happen only once per appointment

---

#### 🔹 Purpose

* Reduce receptionist workload
* Speed up patient arrival process
* Enable kiosk / tablet-based self check-in

---

### 5. Clinical Notes

* SOAP format:

  * Subjective
  * Objective
  * Assessment
  * Plan
* Draft auto-save
* Template-based notes

---

### 6. Billing & Payments

* Invoice generation
* Line items system
* Tax calculation (20%)
* Payment tracking
* Insurance claims
* Payment reminders

---

### 7. Communication

* SMS chat (2-way)
* Email messaging
* Bulk messaging
* Telehealth sessions

---

### 8. Forms & Intake

* Dynamic form builder
* Patient submissions
* Auto-link to patient records

---

### 9. Analytics

* Revenue reports
* Patient growth
* Appointment trends
* Staff performance

---

### 10. Settings

* User management
* Roles & permissions
* Clinic details
* Integrations
* Backup & security

---

## ⚙️ Core Business Rules

### 🔹 Patient

* firstName, lastName, phone → required
* Emergency contact required if patientType = Emergency

---

### 🔹 Appointment

* Must include:

  * patient
  * service
  * practitioner
  * date
  * time
  * room

* Status Flow:

```
Pending → Confirmed → Arrived → In Progress → Completed
Cancelled / No Show allowed
```

---

### 🔹 Clinical Notes

* Must have patientId

* Auto-save draft after inactivity

* Status:

```
Draft → Completed
```

---

### 🔹 Billing

* Tax = 20% (auto-calculated)
* Invoice must have at least 1 line item
* Payment status is independent from invoice

---

### 🔹 Waitlist

* Can convert to appointment
* Removed after conversion

---

### 🔹 RBAC Rules

* Therapist sees only own data
* Receptionist cannot access:

  * clinical notes
  * medical history
* Billing cannot access:

  * appointments
  * clinical modules

---

## 🚫 Out of Scope (Important)

❌ No marketing automation
❌ No AI features
❌ No multi-clinic (for now)
❌ No external integrations (Stripe, Zoom, etc.)

---

## 🎯 Goal

Build a **strict, scalable, and bug-free backend**
that perfectly matches frontend UI and workflows without mismatch.
