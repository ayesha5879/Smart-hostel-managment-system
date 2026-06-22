import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldAlert, Users, CalendarCheck, Check, Clock, UserX } from 'lucide-react';
import api from '../../services/api';

interface AttendanceReport {
  date: string;
  status: string;
  student: { user: { name: string } };
}

interface AssignedComplaint {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

const WardenDashboard: React.FC = () => {
  const [activeVisitors, setActiveVisitors] = useState<number>(0);
  const [assignedComplaints, setAssignedComplaints] = useState<AssignedComplaint[]>([]);
  const [absentees, setAbsentees] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWardenData = async () => {
      try {
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;

        const [statsRes, complaintsRes, attendanceRes] = await Promise.all([
          api.get('/analytics/stats'),
          api.get(`/complaints?status=ASSIGNED`),
          api.get(`/attendance?date=${new Date().toISOString()}`)
        ]);

        setActiveVisitors(statsRes.data.activeVisitors);
        setAssignedComplaints(complaintsRes.data.filter((c: any) => c.assignedWardenId === user?.id).slice(0, 5));
        setAbsentees(attendanceRes.data.filter((a: any) => a.status === 'ABSENT').slice(0, 5));
      } catch (err) {
        console.error('Error fetching warden dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWardenData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-fade">
      {/* Overview header with image */}
      <div className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-2xl border border-border shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 min-h-[140px]">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80" 
          alt="Warden Control Desk" 
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold tracking-tight">Warden Control Desk</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">Mark nightly attendance lists, log incoming/outgoing visitors, and inspect room maintenance requests.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <NavLink to="/attendance" className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition-all hover:bg-primary/95 shadow-md shadow-primary/10 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4" /> Mark Attendance
          </NavLink>
          <NavLink to="/visitors" className="px-4 py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-sm transition-all hover:bg-slate-700 border border-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" /> Gate Log
          </NavLink>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visitors Card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="bg-amber-500/10 text-amber-500 p-4 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Checked-In Guests</span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-0.5">{activeVisitors}</h3>
          </div>
        </div>

        {/* Assigned Complaints Card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">My Assigned Tasks</span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-0.5">{assignedComplaints.length}</h3>
          </div>
        </div>

        {/* Absentees Alert */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl">
            <UserX className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Today's Absentees</span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-0.5">{absentees.length}</h3>
          </div>
        </div>
      </div>

      {/* Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My assigned complaints */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-foreground">Complaints Assigned to Me</h3>
            <NavLink to="/complaints" className="text-xs text-primary hover:underline font-semibold">Inspect all</NavLink>
          </div>
          <div className="divide-y divide-border/60">
            {assignedComplaints.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No active complaints assigned to you.
              </div>
            ) : (
              assignedComplaints.map(c => (
                <div key={c.id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{c.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Category: {c.category} | Priority: {c.priority}</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Absentees List */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-foreground">Today's Absentee Logs</h3>
            <NavLink to="/attendance" className="text-xs text-primary hover:underline font-semibold">Mark/Verify</NavLink>
          </div>
          <div className="divide-y divide-border/60">
            {absentees.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                All residents registered present or late. No absences noted today.
              </div>
            ) : (
              absentees.map((a, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 font-bold flex items-center justify-center text-xs">
                      {a.student.user.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{a.student.user.name}</h4>
                      <p className="text-xs text-muted-foreground">Attendance mismatch flagged</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                    ABSENT
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
