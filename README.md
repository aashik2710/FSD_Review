# 🚜 Mining Equipment & Tyre Management System

A simple, professional, and beginner-friendly web application for managing mining machinery, OTR tyres, daily checks, maintenance, and operational problems. Built with **React.js, Node.js, Express.js, MongoDB, Mongoose, JWT, and Tailwind CSS**.

---

## 🏗️ Architecture & Features

- **Two Simple Roles**:
  - **Admin**: Manages mining companies and user accounts.
  - **Company User**: Manages only their company's equipment, tyres, daily checks, maintenance, problems, history, and reports.
- **Strict Company Data Isolation**: Uses JWT authentication and `companyId` scoping so each mining company accesses only its own data.
- **Simple Menus**:
  - `Dashboard` | `Equipment` | `Tyres` | `Check Equipment` | `Check Tyre` | `Maintenance` | `Problems` | `History` | `Reports`
- **Simple 3 Status System**:
  - 🟢 **Good**
  - 🟡 **Needs Checking**
  - 🔴 **Problem**
- **Indian Mining Localization**:
  - Indian Rupees (`₹` - INR) for all maintenance costs and tyre investments.
  - Pre-seeded with Indian mining companies (Bharat Gold Mines Ltd, Coal India Ltd, NMDC) and locations (Kolar, Karnataka; Dhanbad, Jharkhand; Bengaluru).

---

## 📁 Folder Structure

```
FSD_project/
├── backend/
│   ├── config/             # MongoDB connection
│   ├── controllers/        # Controllers for Equipment, Tyres, Checks, Maintenance, Problems, History
│   ├── middleware/         # JWT Auth & Company Isolation (authMiddleware.js)
│   ├── models/             # Mongoose Models (Company, User, Equipment, Tyre, Inspection, Maintenance, Alert, Report)
│   ├── routes/             # Express API Routes
│   ├── utils/              # Seed data runner with Indian companies & ₹ INR
│   └── server.js           # Backend entry point (Port 5000)
│
└── frontend/
    ├── src/
    │   ├── components/     # AppLayout, Navbar, Sidebar, StatusBadge
    │   ├── context/        # AuthContext, AlertContext, ToastContext
    │   ├── pages/          # Dashboard, Equipment, Tyres, CheckEquipment, CheckTyre, Maintenance, Problems, History, Reports, Login
    │   ├── services/       # Multi-tenant API client (api.js)
    │   └── App.jsx         # React Router routes
```

---

## 🚀 How to Run the Project

### 1. Start the Backend API
```powershell
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000` (auto-seeds Indian mining data on startup).*

### 2. Start the Frontend Application
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🔑 Demo Login Accounts

| Role | Company | Email | Password |
|---|---|---|---|
| **Admin** | Global Platform | `admin@miningplatform.com` | `admin123` |
| **Company User** | Bharat Gold Mines Ltd | `gold.manager@miningcorp.com` | `manager123` |
| **Company User** | Coal India Ltd | `coal.manager@miningcorp.com` | `manager123` |

---

## 📋 Status Guide
- 🟢 **Good**: Machine or tyre is healthy and operating normally.
- 🟡 **Needs Checking**: Low pressure, moderate wear, or routine service due.
- 🔴 **Problem**: Breakdown, critical low tread, or urgent repair required.
