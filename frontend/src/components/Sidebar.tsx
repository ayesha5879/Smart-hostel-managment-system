import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  CreditCard, 
  FileText, 
  UserCheck, 
  ShieldAlert, 
  BrainCircuit, 
  LogOut,
  Settings,
  Flame,
  CalendarCheck
} from 'lucide-react';

interface SidebarProps {
  role: 'SUPER_ADMIN' | 'HOSTEL_MANAGER' | 'WARDEN' | 'STUDENT';
  name: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role, name }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getLinks = () => {
    const common = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    const studentLinks = [
      ...common,
      { to: '/rooms', label: 'My Room', icon: Home },
      { to: '/fees', label: 'Fees & Invoices', icon: CreditCard },
      { to: '/complaints', label: 'Complaints', icon: ShieldAlert },
      { to: '/visitors', label: 'Visitor Passes', icon: Users },
      { to: '/attendance', label: 'Attendance History', icon: CalendarCheck },
    ];

    const wardenLinks = [
      ...common,
      { to: '/attendance', label: 'Mark Attendance', icon: UserCheck },
      { to: '/visitors', label: 'Visitor Check-in', icon: Users },
      { to: '/complaints', label: 'Resolve Complaints', icon: ShieldAlert },
    ];

    const managerLinks = [
      ...common,
      { to: '/students', label: 'Students', icon: Users },
      { to: '/rooms', label: 'Room Allocations', icon: Home },
      { to: '/fees', label: 'Fees & Billing', icon: CreditCard },
      { to: '/complaints', label: 'Complaints Queue', icon: ShieldAlert },
      { to: '/visitors', label: 'Visitor Logs', icon: Users },
      { to: '/attendance', label: 'Attendance Tracking', icon: UserCheck },
    ];

    const adminLinks = [
      ...common,
      { to: '/students', label: 'All Users', icon: Users },
      { to: '/rooms', label: 'Rooms & Building', icon: Home },
      { to: '/fees', label: 'Finance & Ledger', icon: CreditCard },
      { to: '/complaints', label: 'Complaint Stats', icon: ShieldAlert },
      { to: '/visitors', label: 'Visitor Registry', icon: Users },
      { to: '/attendance', label: 'Attendance Data', icon: UserCheck },
      { to: '/analytics', label: 'AI Insights', icon: BrainCircuit },
    ];

    switch (role) {
      case 'SUPER_ADMIN': return adminLinks;
      case 'HOSTEL_MANAGER': return managerLinks;
      case 'WARDEN': return wardenLinks;
      case 'STUDENT': return studentLinks;
      default: return common;
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-2">
        <div className="bg-primary/10 text-primary p-2 rounded-lg">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-tight tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">AEGIS HOSTEL</h1>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{role.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info / Logout Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <h4 className="text-sm font-bold text-foreground truncate">{name}</h4>
            <p className="text-xs text-muted-foreground truncate">{role.toLowerCase()}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 text-sm font-semibold transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
