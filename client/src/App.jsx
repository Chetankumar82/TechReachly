import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { DirectoryPage } from './pages/DirectoryPage';
import { ResumePage } from './pages/ResumePage';
import { CampaignWizard } from './pages/CampaignWizard';
import { CampaignsListPage } from './pages/CampaignsListPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminModerationPage } from './pages/AdminModerationPage';

/**
 * Standard App Shell Layout with Navbar and Depth Glow
 * Accessible to both authenticated users and public visitors (e.g. /directory)
 */
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen saas-bg text-slate-900 dark:text-zinc-100 flex flex-col antialiased transition-colors duration-200 relative">
      {/* Ambient background glow accents for modern SaaS depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 dark:opacity-25 overflow-hidden -z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-3xl rounded-full" />
      </div>
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 lg:py-10">
        {children}
      </main>
      <footer className="border-t border-slate-200 dark:border-zinc-900 py-6 text-center text-xs text-slate-500 dark:text-zinc-500">
        TechReachly • Premium AI IT Outreach CRM & Automation
      </footer>
    </div>
  );
};

/**
 * Authenticated User Protected Route
 */
const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center saas-bg">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

/**
 * Administrator Only Protected Route
 */
const AdminLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center saas-bg">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/directory" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

/**
 * Home Route:
 * If authenticated -> Renders Dashboard
 * If guest / unauthenticated -> Renders the public Engineering Recruiter Directory
 */
const HomeRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center saas-bg">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <DirectoryPage />
      </AppLayout>
    );
  }

  return (
    <ProtectedLayout>
      <Dashboard />
    </ProtectedLayout>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Authentication Views */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Root Route: Shows Dashboard if logged in, shows HR Directory if unauthenticated */}
            <Route path="/" element={<HomeRoute />} />

            {/* Dedicated Public HR Directory View */}
            <Route
              path="/directory"
              element={
                <AppLayout>
                  <DirectoryPage />
                </AppLayout>
              }
            />
            <Route
              path="/resume"
              element={
                <ProtectedLayout>
                  <ResumePage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/campaign/new"
              element={
                <ProtectedLayout>
                  <CampaignWizard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/campaigns"
              element={
                <ProtectedLayout>
                  <CampaignsListPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/campaigns/:id"
              element={
                <ProtectedLayout>
                  <CampaignDetailPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <SettingsPage />
                </ProtectedLayout>
              }
            />

            {/* Administrator Moderation Suite */}
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <AdminModerationPage />
                </AdminLayout>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
