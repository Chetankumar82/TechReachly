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

  return (
    <div className="min-h-screen saas-bg text-slate-900 dark:text-zinc-100 flex flex-col antialiased transition-colors duration-200 relative">
      {/* Ambient background glow accents for modern SaaS depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-40 dark:opacity-25 overflow-hidden -z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[760px] h-[380px] bg-gradient-to-b from-indigo-500/20 via-violet-500/10 to-transparent blur-3xl rounded-full" />
      </div>
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>
      <footer className="border-t border-slate-200 dark:border-zinc-900 py-6 text-center text-xs text-slate-500 dark:text-zinc-500">
        TechReachly • Premium AI IT Outreach CRM & Automation
      </footer>
    </div>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/directory"
              element={
                <ProtectedLayout>
                  <DirectoryPage />
                </ProtectedLayout>
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
