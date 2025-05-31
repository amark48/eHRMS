// src/routes.js
import React from "react";
import Login from "./pages/Login";
import MfaScreen from "./pages/MfaScreen";
import ForgotPassword from "./pages/ForgotPassword";
import AdminDashboard from "./pages/AdminDashboard";
import Tenants from "./pages/Tenants";
import UserManagement from "./pages/UserManagement";
import Subscriptions from "./pages/Subscriptions";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import AuditLogs from "./pages/AuditLogs";
import Support from "./pages/Support";
import Settings from "./pages/Settings";

const routes = [
  // Public routes
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/mfa",
    element: <MfaScreen />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  // Admin Routes
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/tenants",
    element: <Tenants />,
  },
  {
    path: "/admin/users",
    element: <UserManagement />,
  },
  {
    path: "/admin/subscriptions",
    element: <Subscriptions />,
  },
  {
    path: "/admin/billing",
    element: <Billing />,
  },
  {
    path: "/admin/reports",
    element: <Reports />,
  },
  {
    path: "/admin/analytics",
    element: <Analytics />,
  },
  {
    path: "/admin/integrations",
    element: <Integrations />,
  },
  {
    path: "/admin/audit-logs",
    element: <AuditLogs />,
  },
  {
    path: "/admin/support",
    element: <Support />,
  },
  {
    path: "/admin/settings",
    element: <Settings />,
  },
  // Catch-all route
  {
    path: "*",
    element: <AdminDashboard />,
  },
];

export default routes;