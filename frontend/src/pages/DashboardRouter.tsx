import React from 'react';
import SuperAdminDashboard from './dashboards/SuperAdminDashboard';
import HostelManagerDashboard from './dashboards/HostelManagerDashboard';
import WardenDashboard from './dashboards/WardenDashboard';
import StudentDashboard from './dashboards/StudentDashboard';

const DashboardRouter: React.FC = () => {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  const user = JSON.parse(userJson);

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <SuperAdminDashboard />;
    case 'HOSTEL_MANAGER':
      return <HostelManagerDashboard />;
    case 'WARDEN':
      return <WardenDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return (
        <div className="p-8 text-center bg-card rounded-2xl border border-border">
          <h3 className="font-bold text-lg">Unauthorized Role</h3>
          <p className="text-sm text-muted-foreground mt-1">Please log out and sign in with a authorized role.</p>
        </div>
      );
  }
};

export default DashboardRouter;
