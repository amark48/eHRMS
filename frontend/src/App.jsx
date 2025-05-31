// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import MfaScreen from "./pages/MfaScreen";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import Tenants from "./pages/Tenants";
import UserManagement from "./pages/UserManagement";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import BillingManagement from "./pages/BillingManagement";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import AuditLogs from "./pages/AuditLogs";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mfa" element={<MfaScreen />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/tenants" element={<Tenants />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/Subscriptions" element={<SubscriptionManagement />} />
        <Route path="/admin/Billing" element={<BillingManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/integrations" element={<Integrations />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/support" element={<Support />} />
        <Route path="/admin/settings" element={<Settings />} />
        {/* Catch-all route */}
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;