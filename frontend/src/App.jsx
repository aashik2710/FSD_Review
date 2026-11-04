import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { ToastProvider } from './context/ToastContext';

// Layout & Pages
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Equipment from './pages/Equipment';
import Tyres from './pages/Tyres';
import CheckEquipment from './pages/CheckEquipment';
import CheckTyre from './pages/CheckTyre';
import Maintenance from './pages/Maintenance';
import Problems from './pages/Problems';
import History from './pages/History';
import Reports from './pages/Reports';
import Sites from './pages/Sites';
import Users from './pages/Users';

// Route restriction guards
const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return children;
};

const OwnerOrAdminRoute = ({ children }) => {
  const { isSuperAdmin, isOwner } = useAuth();
  if (!isSuperAdmin && !isOwner) return <Navigate to="/" replace />;
  return children;
};

const TechnicianRestrictedRoute = ({ children }) => {
  const { isTechnician } = useAuth();
  if (isTechnician) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AlertProvider>
          <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                      <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route
                  path="companies"
                  element={
                    <SuperAdminRoute>
                      <Companies />
                    </SuperAdminRoute>
                  }
                />
                <Route path="equipment" element={<Equipment />} />
                <Route path="tyres" element={<Tyres />} />
                <Route path="check-equipment" element={<CheckEquipment />} />
                <Route path="check-tyre" element={<CheckTyre />} />
                <Route
                  path="maintenance"
                  element={
                    <TechnicianRestrictedRoute>
                      <Maintenance />
                    </TechnicianRestrictedRoute>
                  }
                />
                <Route path="problems" element={<Problems />} />
                <Route path="alerts" element={<Navigate to="/problems" replace />} />
                <Route path="inspections" element={<Navigate to="/check-equipment" replace />} />
                <Route path="history" element={<History />} />
                <Route
                  path="reports"
                  element={
                    <OwnerOrAdminRoute>
                      <Reports />
                    </OwnerOrAdminRoute>
                  }
                />
                <Route
                  path="sites"
                  element={
                    <OwnerOrAdminRoute>
                      <Sites />
                    </OwnerOrAdminRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <OwnerOrAdminRoute>
                      <Users />
                    </OwnerOrAdminRoute>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AlertProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
