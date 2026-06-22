import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Home, ShieldAlert, CreditCard, ChevronRight, Activity, Clock, FileText } from 'lucide-react';
import api from '../../services/api';

interface GeneralStats {
  totalStudents: number;
  totalRooms: number;
  occupiedBeds: number;
  availableBeds: number;
  pendingComplaints: number;
  activeVisitors: number;
  attendanceRate: number;
}

interface Complaint {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  student: { user: { name: string } };
}

const HostelManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/analytics/stats'),
          api.get('/complaints?status=SUBMITTED')
        ]);
        setStats(statsRes.data);
        setComplaints(complaintsRes.data.slice(0, 5)); // Show latest 5 submitted complaints
      } catch (err) {
        console.error('Error fetching manager dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade">
      {/* Welcome Banner with Image */}
      <div className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-2xl border border-border shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 min-h-[160px]">
        {/* Banner Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80" 
          alt="Operations Control" 
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/60 to-transparent" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold tracking-tight">Claria Operations Control</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-lg">Allocate rooms, verify visitors, check attendance trends, and monitor student reports with real-time operations dashboards.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <NavLink to="/students" className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all hover:bg-primary/95 shadow-md shadow-primary/10">
            Student Register
          </NavLink>
          <NavLink to="/rooms" className="px-4 py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all hover:bg-slate-700 border border-slate-700">
            Assign Rooms
          </NavLink>
        </div>
      </div>

      {/* Mini stats cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Residents</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground">{stats.totalStudents}</h3>
            </div>
            <div className="bg-indigo-500/10 text-indigo-500 p-3 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 border-t border-border/60 pt-4 flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Beds occupied: {stats.occupiedBeds}</span>
            <span>Empty: {stats.availableBeds}</span>
          </div>
        </div>

        {/* Complaints count */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unresolved Tickets</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-rose-500">{stats.pendingComplaints}</h3>
            </div>
            <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 border-t border-border/60 pt-4 flex justify-between items-center text-xs font-medium">
            <NavLink to="/complaints" className="text-rose-500 font-semibold flex items-center gap-0.5 hover:underline">
              Inspect helpdesk queue <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Active Visitors */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checked-In Guests</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-amber-500">{stats.activeVisitors}</h3>
            </div>
            <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 border-t border-border/60 pt-4 flex justify-between items-center text-xs font-medium text-muted-foreground">
            <NavLink to="/visitors" className="text-amber-500 font-semibold flex items-center gap-0.5 hover:underline">
              Review log registry <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">30D Attendance</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-emerald-500">{stats.attendanceRate}%</h3>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 border-t border-border/60 pt-4 flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Daily checkins active</span>
          </div>
        </div>
      </div>

      {/* Main Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submitted Complaints */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-foreground">Recent Submissions Queue</h3>
            <NavLink to="/complaints" className="text-xs text-primary hover:underline font-semibold">View all</NavLink>
          </div>

          <div className="divide-y divide-border/60">
            {complaints.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No newly submitted complaints in queue.
              </div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="py-4 flex justify-between items-center gap-4">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{c.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Student: <span className="font-semibold text-foreground/80">{c.student.user.name}</span> | Cat: {c.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                      c.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                      'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}>
                      {c.priority}
                    </span>
                    <NavLink to={`/complaints`} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border">
                      <ChevronRight className="w-4 h-4" />
                    </NavLink>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Operations Guide */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Operational Checklist</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start p-3 bg-secondary/40 rounded-xl">
              <div className="bg-primary/10 text-primary p-2 rounded-lg mt-0.5">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Room Allocations</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Check bed distributions on floor map and associate students.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 bg-secondary/40 rounded-xl">
              <div className="bg-indigo-500/10 text-indigo-500 p-2 rounded-lg mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Visitor Passes</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Review pending gate passes and authorize parents check-in.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start p-3 bg-secondary/40 rounded-xl">
              <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-lg mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Fee Auditing</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Review overdue invoices and email warnings automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelManagerDashboard;
