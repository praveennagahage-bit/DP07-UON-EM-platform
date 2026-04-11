# UoN Event Management Platform

A web-based full-stack application designed to streamline event creation, management, and registration for organizers and attendees.

---

## 🚀 Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** SQLite
- **Version Control:** GitHub

---

## 📌 Features (Current Scope)

- User Registration (username & password)
- User Login
- Backend API setup
- Basic frontend UI (React)

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/praveennagahage-bit/DP07-UON-EM-platform.git
cd DP07-UON-EM-platform
```

### 2.  Install Backend Dependencies

```bash
npm install
```

### 3. Run Backend Server
```bash
node server.js
```

Server should run on:
http://localhost:3000 (or similar)

### 4. Run Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

#### Frontend will run on:

```bash
http://localhost:5173 
```
---

### 🔗 API Endpoints (Current)

Register User

```code
POST /register
```

Body: 
``` json
{
  "username": "test",
  "password": "1234"
}
```

### 🧠 Project Structure (Current)

```code
DP07-UON-EM-platform/
│
├── server.js          # Backend server
├── database.js        # Database setup
├── users.db           # SQLite database
│
└── client/            # Frontend (React)
    ├── src/
    ├── package.json

```

---- 

## ⚡ Quick Start

```bash
git clone https://github.com/praveennagahage-bit/DP07-UON-EM-platform.git
cd DP07-UON-EM-platform

# Backend
node server.js

# Frontend
cd client
npm install
npm run dev
