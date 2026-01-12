import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Properties = lazy(() => import('./pages/Properties/Properties'));
const PropertyDetail = lazy(() => import('./pages/Properties/PropertyDetail'));
const PropertyForm = lazy(() => import('./pages/Properties/PropertyForm'));
const PropertyImport = lazy(() => import('./pages/Properties/PropertyImport'));
const PropertyMap = lazy(() => import('./pages/Properties/PropertyMap'));
const Contacts = lazy(() => import('./pages/Contacts/Contacts'));
const ContactDetail = lazy(() => import('./pages/Contacts/ContactDetail'));
const ContactForm = lazy(() => import('./pages/Contacts/ContactForm'));
const ContactImport = lazy(() => import('./pages/Contacts/ContactImport'));
const Companies = lazy(() => import('./pages/Companies/Companies'));
const CompanyDetail = lazy(() => import('./pages/Companies/CompanyDetail'));
const CompanyForm = lazy(() => import('./pages/Companies/CompanyForm'));
const Deals = lazy(() => import('./pages/Deals/Deals'));
const DealDetail = lazy(() => import('./pages/Deals/DealDetail'));
const DealForm = lazy(() => import('./pages/Deals/DealForm'));
const Pipeline = lazy(() => import('./pages/Pipeline/Pipeline'));
const Tasks = lazy(() => import('./pages/Tasks/Tasks'));
const TaskDetail = lazy(() => import('./pages/Tasks/TaskDetail'));
const TaskForm = lazy(() => import('./pages/Tasks/TaskForm'));
const Agents = lazy(() => import('./pages/Agents/Agents'));
const AgentDetail = lazy(() => import('./pages/Agents/AgentDetail'));
const Campaigns = lazy(() => import('./pages/Campaigns/Campaigns'));
const CampaignForm = lazy(() => import('./pages/Campaigns/CampaignForm'));
const CampaignAnalytics = lazy(() => import('./pages/Campaigns/CampaignAnalytics'));
const PropertyAlerts = lazy(() => import('./pages/PropertyAlerts/PropertyAlerts'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Communications = lazy(() => import('./components/Communications/CommunicationHub'));
const CalendarIntegration = lazy(() => import('./components/Calendar/CalendarIntegration'));
const AIEmailAssistant = lazy(() => import('./components/AI/AIEmailAssistant'));
const SmartNotifications = lazy(() => import('./components/Notifications/SmartNotifications'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Profile = lazy(() => import('./pages/Profile/Profile'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));
const Leases = lazy(() => import('./pages/Leases/Leases'));
const Debt = lazy(() => import('./pages/Debt/Debt'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AuditLogs = lazy(() => import('./pages/Admin/AuditLogs'));
const SecurityDashboard = lazy(() => import('./pages/Admin/SecurityDashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const MFASetup = lazy(() => import('./pages/MFA/MFASetup'));
const MFAVerify = lazy(() => import('./pages/MFA/MFAVerify'));
const MFASecurity = lazy(() => import('./pages/Settings/MFASecurity'));
const Calendar = lazy(() => import('./pages/Calendar/Calendar'));
const Dashboards = lazy(() => import('./pages/Dashboards/Dashboards'));
const DashboardBuilder = lazy(() => import('./pages/Dashboards/DashboardBuilder'));
const Integrations = lazy(() => import('./pages/Settings/Integrations'));

const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="60vh"
  >
    <CircularProgress size={60} />
  </Box>
);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Public route component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
        {/* Login page - redirects to dashboard if authenticated */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />
        
        {/* MFA Verify - Public route (requires temp token from login) */}
        <Route path="/mfa/verify" element={<MFAVerify />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Admin */}
                    <Route path="admin" element={<AdminDashboard />} />
                    <Route path="admin/audit-logs" element={<AuditLogs />} />
                    <Route path="admin/security" element={<SecurityDashboard />} />

                    {/* Properties */}
                    <Route path="properties" element={<Properties />} />
                    <Route path="properties/new" element={<PropertyForm />} />
                    <Route path="properties/import" element={<PropertyImport />} />
                    <Route path="properties/map" element={<PropertyMap />} />
                    <Route path="properties/:id" element={<PropertyDetail />} />
                    <Route path="properties/:id/edit" element={<PropertyForm />} />

                    {/* Contacts */}
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="contacts/new" element={<ContactForm />} />
                    <Route path="contacts/import" element={<ContactImport />} />
                    <Route path="contacts/:id" element={<ContactDetail />} />
                    <Route path="contacts/:id/edit" element={<ContactForm />} />

                    {/* Companies */}
                    <Route path="companies" element={<Companies />} />
                    <Route path="companies/new" element={<CompanyForm />} />
                    <Route path="companies/:id" element={<CompanyDetail />} />
                    <Route path="companies/:id/edit" element={<CompanyForm />} />

                    {/* Deals */}
                    <Route path="deals" element={<Deals />} />
                    <Route path="deals/new" element={<DealForm />} />
                    <Route path="deals/:id" element={<DealDetail />} />
                    <Route path="deals/:id/edit" element={<DealForm />} />

                    {/* Pipeline */}
                    <Route path="pipeline" element={<Pipeline />} />

                    {/* Leases */}
                    <Route path="leases" element={<Leases />} />
                    <Route path="leases/expirations" element={<Leases />} />
                    <Route path="leases/comps" element={<Leases />} />
                    <Route path="leases/new" element={<Leases />} />

                    {/* Debt */}
                    <Route path="debt" element={<Debt />} />

                    {/* Tasks */}
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="tasks/new" element={<TaskForm />} />
                    <Route path="tasks/:id" element={<TaskDetail />} />
                    <Route path="tasks/:id/edit" element={<TaskForm />} />

                    {/* Agents */}
                    <Route path="agents" element={<Agents />} />
                    <Route path="agents/:id" element={<AgentDetail />} />

                    {/* Campaigns */}
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="campaigns/new" element={<CampaignForm />} />
                    <Route path="campaigns/:id/edit" element={<CampaignForm />} />
                    <Route path="campaigns/:id/analytics" element={<CampaignAnalytics />} />

                    {/* Calendar */}
                    <Route path="calendar" element={<Calendar />} />

                    {/* Dashboards */}
                    <Route path="dashboards" element={<Dashboards />} />
                    <Route path="dashboards/new" element={<DashboardBuilder />} />
                    <Route path="dashboards/:id" element={<DashboardBuilder />} />

                    {/* Property Alerts */}
                    <Route path="property-alerts" element={<PropertyAlerts />} />

                    {/* Reports */}
                    <Route path="reports" element={<Reports />} />
                    <Route path="reports/:reportType" element={<Reports />} />

                    {/* Analytics */}
                <Route path="analytics" element={<Analytics />} />
                <Route path="communications" element={<Communications />} />
                <Route path="calendar" element={<CalendarIntegration />} />
                <Route path="ai-assistant" element={<AIEmailAssistant />} />
                <Route path="notifications" element={<SmartNotifications />} />

                    {/* Settings & Profile */}
                    <Route path="settings" element={<Settings />} />
                    <Route path="settings/mfa" element={<MFASecurity />} />
                    <Route path="settings/integrations" element={<Integrations />} />
                    <Route path="profile" element={<Profile />} />
                    
                    {/* MFA Setup - Protected route */}
                    <Route path="mfa/setup" element={<MFASetup />} />

                    {/* Notifications */}
                    <Route path="notifications" element={<Notifications />} />

                    {/* Default redirect for authenticated users */}
                    <Route path="app" element={<Navigate to="/dashboard" replace />} />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;