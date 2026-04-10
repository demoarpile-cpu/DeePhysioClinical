# AI Rules (Final)

This document defines strict rules for backend development.
All code generation must follow these rules without exception.

---

## 🔒 1. GENERAL RULES

* Do not generate extra files
* Do not modify existing files unless explicitly asked
* Follow project-docs strictly
* Keep code clean, modular, and minimal

---

## 🧠 2. SOURCE OF TRUTH

Always follow in this order:

1. FLOW.md (highest priority)
2. API_SPEC.md
3. DATABASE.md
4. PRD.md
5. ARCHITECTURE.md

If any conflict occurs:
→ Follow higher priority document
→ Do not improvise

---

## 🏗️ 3. ARCHITECTURE RULES

Strict flow must be followed:

Route → Validation → Controller → Service → Prisma

* No skipping layers
* No direct DB access in controller
* Each feature must be modular and isolated

---

## 📁 4. MODULE STRUCTURE RULES

Each module must contain only:

* *.controller.js
* *.service.js
* *.routes.js
* *.validation.js

Do not create:

* extra helpers
* duplicate files
* unnecessary nested folders

---

## 🗄️ 5. DATABASE RULES

* Use Prisma ORM only
* Do not write raw SQL
* Follow defined schema strictly
* Use snake_case for DB fields
* Do not add new tables or fields without instruction

---

## 🌐 6. API RULES

* Follow API_SPEC.md exactly
* Do not add or remove endpoints without instruction
* Use camelCase in request/response
* Do not change request body structure

---

## 🔐 7. AUTHENTICATION RULES

* Use JWT for authentication
* All routes must be protected except login
* Extract user from token
* Never accept userId from request body

---

## 🔒 8. AUTHORIZATION RULES (RBAC)

Roles:

* admin
* therapist
* receptionist
* billing

Rules:

* Always use role middleware
* Never hardcode role checks in controller
* Always validate access before service logic

---

## ⚙️ 9. BUSINESS LOGIC RULES

Must strictly follow FLOW.md:

* No invoice before appointment completion
* No appointment without patient
* No note without patient
* No unauthorized data access
* Appointment status must follow defined lifecycle

---

## 🟢 9.1 CHECK-IN RULES (NEW)

* Only scheduled or confirmed appointments can be checked-in
* Status transition allowed:

```txt
scheduled → checked_in
confirmed → checked_in
```

* Must set:

  * status = checked_in
  * checked_in_at = current timestamp

* Patient must match:

  * first initial
  * last name
  * date of birth

* Only same-day appointments allowed

* Appointment can be checked-in only once

---

## 📦 10. CONTROLLER RULES

* Controllers must be thin
* Only handle request and response
* Call service layer only
* No business logic inside controllers

---

## 🔧 11. SERVICE RULES

* All business logic goes here
* All Prisma queries go here
* Handle validations and conditions
* Throw structured errors with statusCode

---

## 🧪 12. VALIDATION RULES

* Validate all inputs using Joi/Zod
* Reject invalid requests before controller logic
* Do not allow missing required fields

---

## 📊 13. RESPONSE RULES

All responses must follow:

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Optional"
}
```

### Error

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## 🔐 14. SECURITY RULES

* Hash passwords using bcrypt
* Never expose password or sensitive data
* Sanitize all inputs

---

## 🧾 15. NAMING RULES

* Files → patients.controller.js
* Variables → camelCase
* DB → snake_case
* API → camelCase

---

## ⚠️ 16. STRICT RESTRICTIONS

* Do not assume missing fields
* Do not generate full backend at once
* Generate only requested part
* Do not overwrite existing code

---

## 🚫 17. PROHIBITED ACTIONS

* No skipping flow steps
* No direct DB access in routes/controllers
* No role bypass
* No invalid status transitions

---

## ⚠️ CONFLICT RESOLUTION RULE

* Frontend is not always the source of truth
* Business logic (FLOW.md) has higher priority

If conflict occurs:
→ Follow FLOW.md and DATABASE.md
→ Reject invalid frontend behavior
→ Do not implement incorrect logic

Frontend must be updated to match backend rules

---

## 🗄️ DATABASE TYPE RULE

* Always use MySQL (not PostgreSQL)
* Follow DATABASE_URL from .env
* Do not change database provider

---

## 🎯 FINAL RULE

If generated code violates:

* FLOW.md
* DATABASE.md
* API_SPEC.md

→ It is invalid and must be rejected
