import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');
  const userJson = localStorage.getItem('user');

  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userJson);

  // Derive title from route pathname
  const getPageTitle = (path: string) => {
    if (path.startsWith('/rooms')) return 'Room Allocation';
    if (path.startsWith('/students')) return 'Student Registry';
    if (path.startsWith('/fees')) return 'Fee Ledger';
    if (path.startsWith('/complaints')) return 'Complaint Helpdesk';
    if (path.startsWith('/visitors')) return 'Gatepass Registry';
    if (path.startsWith('/attendance')) return 'Attendance Portal';
    if (path.startsWith('/analytics')) return 'AI Predictive Analytics';
    return 'Dashboard Analytics';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar navigation */}
      <Sidebar role={user.role} name={user.name} />

      {/* Main content body */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Header title={getPageTitle(location.pathname)} />
        <main className="p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
