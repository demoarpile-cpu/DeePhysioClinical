# Backend Architecture (Final)

---

## 📌 Tech Stack

* Node.js
* Express.js
* MySQL (clinic_management_db)
* Prisma ORM
* JWT Authentication

---

## 📁 Project Structure

```
backend/
└── src/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── patients/
    │   ├── appointments/
    │   ├── checkin/          ← NEW MODULE
    │   ├── waitlist/
    │   ├── notes/
    │   ├── billing/
    │   ├── communication/
    │   ├── forms/
    │
    ├── middleware/
    │   ├── auth.middleware.js
    │   ├── role.middleware.js
    │   ├── error.middleware.js
    │
    ├── config/
    │   ├── prisma.js
    │   ├── env.js
    │
    ├── utils/
    │   ├── response.js
    │   ├── logger.js
    │
    ├── app.js
    └── server.js

prisma/
└── schema.prisma

project-docs/
```

---

## 🧠 Architecture Pattern

Strict Layered Architecture:

Route → Validation → Controller → Service → Prisma (DB)

---

## 🔄 Request Flow

Request
→ Auth Middleware (JWT verify)
→ Role Middleware (RBAC)
→ Validation (Joi/Zod)
→ Controller
→ Service (business logic)
→ Prisma (DB)
→ Response

---

## 📦 Module Structure (MANDATORY)

Each module must contain:

* *.controller.js
* *.service.js
* *.routes.js
* *.validation.js

Example:

```
patients/
├── patients.controller.js
├── patients.service.js
├── patients.routes.js
└── patients.validation.js
```

---

## 🔐 Authentication

* JWT-based authentication
* Token required in header:
  Authorization: Bearer TOKEN

---

## 🔒 Authorization (RBAC)

Roles:

* admin
* therapist
* receptionist
* billing

Rules:

* Always use role middleware
* Never hardcode role checks in controller

---

## 🧩 Business Logic Placement

| Layer      | Responsibility   |
| ---------- | ---------------- |
| Route      | Endpoint define  |
| Validation | Input validation |
| Controller | Request/Response |
| Service    | Business logic   |
| Prisma     | DB operations    |

---

## 📊 Naming Conventions

* Files → patients.controller.js
* Variables → camelCase
* DB fields → snake_case
* API fields → camelCase

---

## 🧾 API Rules

* REST-based APIs
* HTTP Methods:

  * GET → fetch
  * POST → create
  * PUT → update
  * DELETE → remove

---

## 🧠 Special System Logic (STRICT)

### Appointment

* Must include:

  * patient_id
  * therapist_id
  * service
  * room

* Must support:

  * duration handling
  * automatic end_time calculation
  * availability slot validation

Status Flow:

```txt id="appt-flow-final"
scheduled → confirmed → checked_in → in_progress → completed
cancelled / no_show allowed
```

---

### 🟢 Check-in (NEW MODULE)

* Separate module (not part of appointment controller)
* Handles patient self check-in

Flow:

```txt id="checkin-flow-final"
Search → Match Patient → Fetch Appointment → Arrive → Update Status
```

Rules:

* Only scheduled/confirmed appointments allowed
* Must update:

  * status = checked_in
  * checked_in_at timestamp
* Must match:

  * first initial
  * last name
  * date of birth
* Only same-day appointment allowed

---

### Waitlist

* Separate module
* Can convert to appointment
* Must remove entry after conversion

---

### Clinical Notes

* SOAP structure:

  * subjective
  * objective
  * assessment
  * plan

* Must support:

  * draft auto-save
  * templates

Status:

```txt id="notes-flow-final"
draft → completed
```

---

### Billing

* Invoice must include:

  * line_items (array)
  * tax (20%)

* Total calculation:
  total = sum(line_items) + tax

* Payment handled separately

---

### Communication

* Must support:

  * SMS
  * Email
  * Bulk messaging

* Two-way messaging required:

  * inbound
  * outbound

* sender_id and receiver_id mandatory

---

## ⚠️ Error Handling

* Use centralized error middleware
* Always return structured response

---

## ✅ Response Format

### Success

```json id="resp-success"
{
  "success": true,
  "data": {},
  "message": "Optional"
}
```

### Error

```json id="resp-error"
{
  "success": false,
  "message": "Error message"
}
```

---

## 🔐 Security Rules

* Hash passwords (bcrypt)
* Never expose sensitive fields
* Validate all inputs

---

## 🌱 Environment Variables

.env

```
DATABASE_URL=
JWT_SECRET=
PORT=
```

---

## 🚫 Strict Rules

* No business logic in routes
* No DB access in controllers
* Always use services
* Do not create extra files
* Follow project-docs strictly

---

## 🎯 Final Rule

If any conflict occurs:

→ Follow FLOW.md, DATABASE.md, API_SPEC.md, PRD.md
→ Do not improvise
