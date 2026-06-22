import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

// Import Pages
import DashboardRouter from './pages/DashboardRouter';
import StudentManagement from './pages/StudentManagement';
import RoomManagement from './pages/RoomManagement';
import BillingInvoices from './pages/BillingInvoices';
import ComplaintManagement from './pages/ComplaintManagement';
import VisitorManagement from './pages/VisitorManagement';
import AttendanceTracking from './pages/AttendanceTracking';
import AnalyticsInsights from './pages/AnalyticsInsights';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Secure Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRouter />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="fees" element={<BillingInvoices />} />
            <Route path="complaints" element={<ComplaintManagement />} />
            <Route path="visitors" element={<VisitorManagement />} />
            <Route path="attendance" element={<AttendanceTracking />} />
            <Route path="analytics" element={<AnalyticsInsights />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
