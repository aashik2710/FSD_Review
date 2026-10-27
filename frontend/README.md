# ⛏️ TerraSync - Mining Telemetry & Tyre Management Platform (Frontend)

**TerraSync** is an industrial-grade web application designed for real-time mining equipment telemetry, OTR (Off-The-Road) tyre lifecycle monitoring, field inspection logging, and maintenance workflow orchestration.

---

## 🚀 Key Features

- **📊 Real-Time Telemetry Dashboard**: Fleet operational status, live anomaly tickers, OTR tyre health distribution (Recharts donut/bar charts), and monthly maintenance expenditure analytics.
- **🚜 Heavy Fleet Equipment Management**: Comprehensive CRUD operations for Haul Trucks, Hydraulic Excavators, Wheel Loaders, and Drill Rigs with status monitoring (`Active`, `Maintenance`, `Breakdown`, `Decommissioned`).
- **🛞 OTR Tyre Tracking & Lifecycle**: Axle position mounting, tyre rotation workflows, real-time PSI/Temperature sensors, tread depth meters, and full lifecycle history tracking.
- **📋 Field Diagnostics & Inspections**: Dual-mode inspection logging for machinery and tyre sets with severity scoring (`Pass`, `Monitor`, `Action Required`, `Critical`).
- **🔧 Work Order & Maintenance Management**: End-to-end maintenance lifecycle (`Scheduled` ➔ `In Progress` ➔ `Completed`), spare parts tracking, technician assignment, and expenditure recording.
- **🚨 Real-Time Safety Alerts & Anomaly Scanner**: Rule-based telemetry analysis for thermal threshold overruns, low tyre pressures, and missed inspection alerts with instant resolution triggers.
- **📍 Multi-Site Mining Hubs**: Management of open-pit and underground mining operational sites (e.g., Pilbara North, Hunter Valley).
- **👥 Personnel & Role-Based Access Control**: Roster management supporting `Admin`, `Fleet Manager`, `Field Technician`, and `Safety Officer` roles.
- **🔔 Industrial Toast System**: Non-blocking toast notifications for operations, diagnostics, and telemetry updates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) |
| **Build Tool** | [Vite 8](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla Industrial CSS |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **Routing** | [React Router v7](https://reactrouter.com/) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Code Quality** | [Oxlint](https://oxc.rs/) |

---

## 📂 Project Structure

```
frontend/
├── public/                  # Static public assets
├── src/
│   ├── assets/              # Icons and local media
│   ├── components/
│   │   ├── common/          # Reusable UI widgets (Modals, StatCards, Badges)
│   │   └── layout/          # Navbar, Sidebar, AppLayout, Mobile Drawer
│   ├── context/
│   │   ├── AuthContext.jsx  # Authentication state & demo profile switching
│   │   ├── ToastContext.jsx # Reactive toast notifications
│   │   └── AlertContext.jsx # Real-time alerts polling & counters
│   ├── pages/
│   │   ├── Dashboard.jsx    # Primary KPI metrics & fleet visualization
│   │   ├── Equipment.jsx    # Machinery fleet inventory & inspector
│   │   ├── Tyres.jsx        # OTR tyre telemetry & axle mounting
│   │   ├── Inspections.jsx  # Diagnostic inspections & field audit logging
│   │   ├── Maintenance.jsx  # Work orders & parts replacement tracker
│   │   ├── Alerts.jsx       # Real-time anomaly scanner & safety warnings
│   │   ├── Sites.jsx        # Mining operational locations & hubs
│   │   ├── Users.jsx        # Personnel roster & credential administration
│   │   └── Login.jsx        # Industrial auth portal with 1-click demo logins
│   ├── services/
│   │   └── api.js           # Centralized Axios client & API endpoints
│   ├── App.jsx              # Application router & context wrappers
│   ├── main.jsx             # Entry point
│   └── index.css            # Industrial theme tokens & animations
├── package.json             # Dependencies & scripts
└── vite.config.js           # Vite build configuration
```

---

## ⚡ How to Run the Project

### Prerequisites
- **Node.js**: v18.0.0 or higher installed
- **npm** (comes with Node.js)
- *(Optional)* Local MongoDB running, or zero-config (the backend automatically starts an in-memory MongoDB engine if local MongoDB is not found!)

---

### Step 1: Start the Backend Server (Terminal 1)

Open a terminal at the project root:

```bash
cd backend
npm install
npm start
```
> **Backend URL**: `http://localhost:5000`  
> **Health Check**: `http://localhost:5000/api/health`  
> *Note: On startup, the backend automatically seeds sample Indian mining companies, equipment, tyres, and user accounts if the database is fresh.*

---

### Step 2: Start the Frontend Application (Terminal 2)

Open a second terminal at the project root:

```bash
cd frontend
npm install
npm run dev
```
> **Frontend URL**: `http://localhost:5173`  
> *Requests to `/api` are automatically proxied to `http://localhost:5000` via Vite.*

---

## 📜 Available Scripts

### In `/backend`:
- `npm start` — Starts the Node.js Express server.
- `npm run dev` — Starts the server with `--watch` for hot reloading on file changes.
- `npm run seed` — Manually re-seeds sample mining data.

### In `/frontend`:
- `npm run dev` — Starts Vite dev server with Hot Module Replacement (HMR) on port 5173.
- `npm run build` — Compiles and minifies the app for production in `dist/`.
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs Oxlint for code quality checks.

---

## 🔐 Demo Credentials

Quick 1-click login buttons are available directly on the Login page (`http://localhost:5173/login`):

| Role | Company / Scope | Email | Password |
|---|---|---|---|
| **Platform Super Admin** | Global Platform | `admin@miningplatform.com` | `admin123` |
| **Gold Mining Owner** | Bharat Gold Mines Ltd (BGML) | `gold.owner@miningcorp.com` | `owner123` |
| **Gold Mining Manager** | Bharat Gold Mines Ltd (Kolar Fleet) | `gold.manager@miningcorp.com` | `manager123` |
| **Coal Mining Owner** | Coal India Ltd (CIL) | `coal.owner@miningcorp.com` | `owner123` |
| **Coal Mining Manager** | Coal India Ltd (Jharia Basin) | `coal.manager@miningcorp.com` | `manager123` |
| **Site Technician** | Field Operations | `gold.tech@miningcorp.com` | `tech123` |
