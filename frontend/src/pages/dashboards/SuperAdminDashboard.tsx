import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Users, Home, ShieldAlert, CreditCard, UserCheck, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import api from '../../services/api';

interface GeneralStats {
  totalStudents: number;
  totalRooms: number;
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  pendingComplaints: number;
  activeVisitors: number;
  attendanceRate: number;
  finance: {
    collected: number;
    outstanding: number;
  };
}

const SuperAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<GeneralStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching analytics stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Finance chart data
  const financeData = [
    { name: 'Collections', Collected: stats.finance.collected, Outstanding: stats.finance.outstanding }
  ];

  // Room type occupancy ratio
  const occupancyRate = stats.totalCapacity > 0 ? (stats.occupiedBeds / stats.totalCapacity) * 100 : 0;

  const roomDistribution = [
    { name: 'Occupied Beds', value: stats.occupiedBeds },
    { name: 'Available Beds', value: stats.availableBeds }
  ];

  const COLORS = ['#6366f1', '#e2e8f0'];

  return (
    <div className="space-y-8 page-fade">
      {/* Greeting Header with image */}
      <div className="relative overflow-hidden bg-slate-900 text-white p-8 rounded-2xl border border-border shadow-md flex justify-between items-center min-h-[140px]">
        <img 
          src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80" 
          alt="Super Admin Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent" />
        
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, Super Admin</h1>
          <p className="text-sm text-slate-300 mt-1">Hostel operations, room capacity models, and ledger statuses.</p>
        </div>
        <div className="relative z-10 bg-primary/20 text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 border border-primary/30 backdrop-blur-md">
          <Activity className="w-4 h-4 text-primary-foreground" /> Live Metrics Active
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Students</span>
              <h3 className="text-3xl font-extrabold tracking-tight">{stats.totalStudents}</h3>
            </div>
            <div className="bg-indigo-500/10 text-indigo-500 p-3 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-indigo-500 font-semibold gap-1">
            <span>Student registry logs</span> <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Room Occupancy Card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bed Occupancy</span>
              <h3 className="text-3xl font-extrabold tracking-tight">{Math.round(occupancyRate)}%</h3>
            </div>
            <div className="bg-primary/10 text-primary p-3 rounded-xl">
              <Home className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            {stats.occupiedBeds} of {stats.totalCapacity} beds currently allocated.
          </p>
        </div>

        {/* Pending Complaints Card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Complaints Active</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-rose-500">{stats.pendingComplaints}</h3>
            </div>
            <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-rose-500 font-semibold gap-1">
            <span>Review urgent tickets</span> <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Ledger Collections Card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collected Dues</span>
              <h3 className="text-3xl font-extrabold tracking-tight text-emerald-500">${stats.finance.collected.toLocaleString()}</h3>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-medium">
            Outstanding receivables: <span className="text-red-500 font-semibold">${stats.finance.outstanding.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger summary */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm lg:col-span-2">
          <h3 className="font-bold text-base text-foreground mb-4">Financial Ledger Collections</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Collected" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Outstanding" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Allocations Pie */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-foreground mb-4">Hostel Bed Allocations</h3>
            <div className="h-60 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {roomDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-border/60">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="flex items-center gap-2 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Occupied beds
              </span>
              <span>{stats.occupiedBeds} Beds</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Empty beds
              </span>
              <span>{stats.availableBeds} Beds</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
