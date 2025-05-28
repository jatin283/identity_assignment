# Bitespeed Backend Task: Identity Reconciliation

This project solves the Identity Reconciliation problem by managing and linking user contact records based on email and phone numbers. It is built using Node.js, Express, and PostgreSQL.

---

## 🔗 Deployed Endpoint (/identify)

- POST: [`https://identity-assignment-6ne1.onrender.com/identify`](https://identity-assignment-6ne1.onrender.com/identify)

---

## Problem Statement

Users may submit their contact information (email and/or phone number) which might already exist in different forms in the database. The task is to identify the primary identity and consolidate all related contact records under it.

Each identity can be:
- Primary (original user contact)
- Secondary (linked to a primary contact)

The system should:
- Merge identities based on matching email or phone number
- Return a structured object containing:
  - Primary contact ID
  - All associated emails
  - All associated phone numbers
  - All secondary contact IDs

---

## 🛠 Tech Stack

- Backend: Node.js, Express.js
- Database: PostgreSQL (hosted on Render)
- ORM/DB Tool: `pg` Node.js package

---

## 📁 Project Structure
Running Locally
1. Clone the repository - 
git clone https://github.com/jatin283/identity_assignment
cd identity_assignment

2. Set up environment variables
Create a .env file in the root directory:
DATABASE_URL=postgres://postgres:new_password@127.0.0.1:5432/bitespeed

3. Install dependencies
npm install

4. Start the server
node index.js
