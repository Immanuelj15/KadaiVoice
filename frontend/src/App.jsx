import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import VoiceAssistant from './pages/VoiceAssistant';
import Soundbox from './pages/Soundbox';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import Customers from './pages/Customers';
import CreditManagement from './pages/CreditManagement';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import OnboardingWizard from './pages/OnboardingWizard';
import { useAuth } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading KadaiVoice AI...
          </span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Onboarding Wizard */}
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <OnboardingWizard />
            </ProtectedRoute>
          }
        />

        {/* Protected App Layout Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/voice" element={<VoiceAssistant />} />
          <Route path="/soundbox" element={<Soundbox />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/credit" element={<CreditManagement />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/insights" element={<AIInsights />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
