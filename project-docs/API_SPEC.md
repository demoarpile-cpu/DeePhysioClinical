# API Specification (Final)

Base URL:
http://localhost:5000/api

---

## 🔐 AUTH MODULE

### POST /auth/login

Login user

Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "JWT",
    "user": {
      "id": 1,
      "name": "John",
      "role": "therapist"
    }
  }
}
```

---

## 👥 USERS MODULE (Admin Only)

### GET /users

Get all users

---

### POST /users

Create user

Body:

```json
{
  "name": "John",
  "email": "john@mail.com",
  "password": "123456",
  "role": "therapist"
}
```

---

## 🧑‍⚕️ PATIENTS MODULE

### POST /patients

Create patient

Access: Admin, Receptionist

Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9999999999",
  "email": "john@mail.com",
  "address": "Address",
  "medicalHistory": "",
  "emergencyContact": "",
  "insuranceInfo": ""
}
```

---

### GET /patients

Get all patients

---

### GET /patients/:id

Get single patient

---

### PUT /patients/:id

Update patient

---

## 📅 APPOINTMENTS MODULE

### POST /appointments

Create appointment

Access: Admin, Receptionist

Body:

```json
{
  "patientId": 1,
  "therapistId": 2,
  "service": "Physiotherapy",
  "room": "Room 1",
  "startTime": "2026-03-26T10:00:00",
  "duration": 60
}
```

Note:

* endTime auto-calculated
* created_by auto set

---

### GET /appointments

Get appointments

Query:

* date
* therapistId
* patientId

---

### GET /appointments/:id

---

### PUT /appointments/:id

Update appointment

Body:

```json
{
  "status": "confirmed"
}
```

---

### DELETE /appointments/:id

Cancel / delete appointment

---

## 🟢 CHECK-IN MODULE (NEW)

### POST /checkin/search

Search appointment for self check-in

Body:

```json
{
  "initial": "K",
  "lastName": "Sharma",
  "dob": "2000-01-01"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "appointmentId": 1,
    "patient": {
      "name": "Karan Sharma"
    },
    "appointmentDate": "2026-03-28T10:00:00"
  }
}
```

---

### POST /checkin/arrive

Mark patient as arrived (check-in)

Body:

```json
{
  "appointmentId": 1
}
```

Response:

```json
{
  "success": true,
  "message": "Patient checked-in successfully"
}
```

---

## ⏳ WAITLIST MODULE

### POST /waitlist

Add to waitlist

Body:

```json
{
  "patientId": 1,
  "preferredDate": "2026-03-26",
  "preferredTime": "10:00",
  "notes": ""
}
```

---

### GET /waitlist

Get all waitlist entries

---

### POST /waitlist/:id/convert

Convert to appointment

---

### DELETE /waitlist/:id

Remove waitlist entry

---

## 📝 NOTES MODULE

### POST /notes

Create note

Access: Therapist

Body:

```json
{
  "patientId": 1,
  "subjective": "",
  "objective": "",
  "assessment": "",
  "plan": "",
  "status": "draft"
}
```

---

### PUT /notes/:id

Update note

---

### GET /notes/:patientId

Get patient notes

---

## 💬 COMMUNICATION MODULE

### POST /messages/send

Send message

Body:

```json
{
  "receiverId": 1,
  "type": "sms",
  "content": "Reminder"
}
```

Note:

* sender_id auto from JWT
* direction = outbound

---

### POST /messages/bulk

Bulk send

Body:

```json
{
  "receiverIds": [1, 2],
  "type": "sms",
  "content": "Bulk message"
}
```

---

### GET /messages/:receiverId

Get conversation

---

## 💰 BILLING MODULE

### POST /invoices

Create invoice

Access: Admin, Billing

Body:

```json
{
  "patientId": 1,
  "appointmentId": 1,
  "lineItems": [],
  "subtotal": 100,
  "tax": 20,
  "totalAmount": 120
}
```

---

### GET /invoices

---

### GET /invoices/:id

---

### PUT /invoices/:id

Update invoice status

Body:

```json
{
  "status": "paid"
}
```

---

### POST /payments

Add payment

Body:

```json
{
  "invoiceId": 1,
  "amount": 120,
  "method": "cash"
}
```

---

## 📄 FORMS MODULE

### POST /forms

Create form

Body:

```json
{
  "title": "Intake Form",
  "type": "intake",
  "fields": []
}
```

---

### GET /forms

---

### POST /forms/submit

Submit form

Body:

```json
{
  "formId": 1,
  "patientId": 1,
  "answers": {}
}
```

---

## 🔐 COMMON RULES

* All routes require JWT (except login)
* Use: Authorization → Bearer TOKEN
* created_by always from logged-in user

---

## 📦 RESPONSE FORMAT

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
