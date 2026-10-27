import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mining_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedCompanyId, setSelectedCompanyIdState] = useState(() => {
    return localStorage.getItem('mining_selected_company_id') || 'ALL';
  });

  const [loading, setLoading] = useState(false);

  const setSelectedCompanyId = (id) => {
    setSelectedCompanyIdState(id);
    localStorage.setItem('mining_selected_company_id', id);
    // Trigger local state updates
    window.dispatchEvent(new Event('tenant_changed'));
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('mining_auth_token');
      if (!token) return;
      try {
        const res = await authAPI.getMe();
        if (res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('mining_auth_user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid token');
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { token, ...userData } = res.data.data;
      localStorage.setItem('mining_auth_token', token);
      localStorage.setItem('mining_auth_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await authAPI.register(formData);
      const { token, ...userData } = res.data.data;
      localStorage.setItem('mining_auth_token', token);
      localStorage.setItem('mining_auth_user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mining_auth_token');
    localStorage.removeItem('mining_auth_user');
    localStorage.removeItem('mining_selected_company_id');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    const updated = res.data.data;
    setUser(updated);
    localStorage.setItem('mining_auth_user', JSON.stringify(updated));
    return updated;
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('mining_auth_user', JSON.stringify(updatedUser));
  };

  // Role resolution
  const role = user?.role || 'TECHNICIAN';
  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isOwner = role === 'OWNER';
  const isManager = role === 'MAINTENANCE_MANAGER';
  const isTechnician = role === 'TECHNICIAN';

  const roleTitle = isOwner
    ? 'Company Owner'
    : isManager
      ? 'Company Manager'
      : isSuperAdmin
        ? 'Platform Admin'
        : 'Field Technician';

  // Permission capabilities
  const isAdmin = isSuperAdmin || isOwner;
  const canManageCompanies = isSuperAdmin;
  const canManageSites = isSuperAdmin || isOwner;
  const canManageUsers = isSuperAdmin || isOwner;
  const canManageFleet = isSuperAdmin || isOwner || isManager;
  const canManageEquipment = canManageFleet;
  const canManageTyres = canManageFleet;
  const canEditFleet = isSuperAdmin || isOwner || isManager || isTechnician; // Technician can edit like manager
  const canEditEquipment = canEditFleet;
  const canEditTyres = canEditFleet;
  const canDeleteRecords = isSuperAdmin || isOwner;
  const canCreateMaintenance = isSuperAdmin || isOwner || isManager;
  const canApproveMaintenance = isSuperAdmin || isOwner;
  const canCompleteMaintenance = true; // Technicians, Managers, Owners can complete
  const canScheduleMaintenance = !isTechnician; // Technician cannot access maintenance planning
  const canViewReports = isSuperAdmin || isOwner; // Report field removed from Manager and Technician
  const canPerformInspection = true; // All authenticated roles can log field inspections
  const canReportProblem = true; // All roles, especially Technician, can report problems

  const company = (user?.company && typeof user.company === 'object')
    ? user.company
    : (user?.companyId && typeof user.companyId === 'object')
      ? user.companyId
      : null;

  const companyName = company?.name || user?.companyName || (typeof user?.company === 'string' ? user.company : (typeof user?.companyId === 'string' ? user.companyId : 'Mining Fleet'));

  const value = {
    user,
    role,
    roleTitle,
    company,
    companyName,
    selectedCompanyId,
    setSelectedCompanyId,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUserProfile,
    isAuthenticated: !!user,
    isAdmin,
    isSuperAdmin,
    isOwner,
    isManager,
    isTechnician,
    canManageCompanies,
    canManageSites,
    canManageUsers,
    canManageFleet,
    canManageEquipment,
    canManageTyres,
    canEditFleet,
    canEditEquipment,
    canEditTyres,
    canDeleteRecords,
    canCreateMaintenance,
    canApproveMaintenance,
    canCompleteMaintenance,
    canScheduleMaintenance,
    canViewReports,
    canPerformInspection,
    canReportProblem
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
