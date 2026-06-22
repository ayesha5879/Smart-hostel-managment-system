import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { BrainCircuit, Home, ShieldAlert, CreditCard, Clock, Activity, Loader2 } from 'lucide-react';
import api from '../services/api';

interface OccupancyData {
  historical: Array<{ month: string; actual: number; predicted: number; capacity: number }>;
  forecast: Array<{ month: string; actual: null; predicted: number; capacity: number }>;
  insights: string;
}

interface ComplaintData {
  statistics: Array<{ category: string; count: number; percentage: number; recent: number; prior: number }>;
  avgResolutionHours: number;
  insights: string;
}

interface PaymentRisk {
  risks: Array<{ studentId: string; name: string; rollNumber: string; score: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; pendingOverdue: number; pastLateCount: number }>;
  insights: string;
}

interface AttendanceRisk {
  risks: Array<{ studentId: string; name: string; rollNumber: string; attendanceRate: number; consecutiveAbsents: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; score: number }>;
  insights: string;
}

const AnalyticsInsights: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OCCUPANCY' | 'COMPLAINTS' | 'FEES' | 'ATTENDANCE'>('OCCUPANCY');
  const [loading, setLoading] = useState(true);

  // States
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [complaints, setComplaints] = useState<ComplaintData | null>(null);
  const [fees, setFees] = useState<PaymentRisk | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRisk | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'OCCUPANCY' && !occupancy) {
        const res = await api.get('/analytics/occupancy');
        setOccupancy(res.data);
      } else if (activeTab === 'COMPLAINTS' && !complaints) {
        const res = await api.get('/analytics/complaints');
        setComplaints(res.data);
      } else if (activeTab === 'FEES' && !fees) {
        const res = await api.get('/analytics/fees');
        setFees(res.data);
      } else if (activeTab === 'ATTENDANCE' && !attendance) {
        const res = await api.get('/analytics/attendance');
        setAttendance(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Merge historical and forecast occupancy for chart
  const getOccupancyChartData = () => {
    if (!occupancy) return [];
    return [...occupancy.historical, ...occupancy.forecast];
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Analytics Hub</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Predict hostel utilization trends, payment risk matrices, and check attendance forecasts.</p>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-border/80 pb-4">
        {[
          { key: 'OCCUPANCY', label: 'Occupancy Forecasting', icon: Home },
          { key: 'COMPLAINTS', label: 'Complaint Patterns', icon: ShieldAlert },
          { key: 'FEES', label: 'Payment Delinquency', icon: CreditCard },
          { key: 'ATTENDANCE', label: 'Attendance Risk Indicators', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === tab.key
                  ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/15'
                  : 'bg-card border-border hover:bg-secondary/40 text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Analytics Content */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* AI Insights alert */}
          <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex gap-4 items-start leading-relaxed page-fade">
            <BrainCircuit className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">AI Core Insights</span>
              <p className="text-xs font-semibold text-foreground/80 mt-1">
                {activeTab === 'OCCUPANCY' && occupancy?.insights}
                {activeTab === 'COMPLAINTS' && complaints?.insights}
                {activeTab === 'FEES' && fees?.insights}
                {activeTab === 'ATTENDANCE' && attendance?.insights}
              </p>
            </div>
          </div>

          {/* Forecast Occupancy Charts */}
          {activeTab === 'OCCUPANCY' && occupancy && (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 page-fade">
              <h3 className="font-bold text-sm text-foreground">Bed Demand Forecasting (6-Month Extrapolation)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getOccupancyChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name="Actual occupancy" />
                    <Line type="monotone" dataKey="predicted" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" name="AI Predicted occupancy" />
                    <Line type="monotone" dataKey="capacity" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="2 2" name="Total Capacity Limit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Complaint trends */}
          {activeTab === 'COMPLAINTS' && complaints && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 page-fade">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
                <h3 className="font-bold text-sm text-foreground">Complaint Category Surges (Current vs Last Month)</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={complaints.statistics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="prior" fill="#94a3b8" name="Prior Month Counts" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="recent" fill="#6366f1" name="Recent Month Counts" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Statistics panels */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-foreground">Infrastructure Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-semibold">Average Resolution Time</span>
                      <span className="font-bold text-foreground">{complaints.avgResolutionHours.toFixed(1)} Hours</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-semibold">Verification Accuracy</span>
                      <span className="font-bold text-primary">91% Confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fees Delinquency Risk table */}
          {activeTab === 'FEES' && fees && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm page-fade">
              <div className="px-6 py-4 border-b border-border bg-muted/10">
                <h3 className="font-bold text-sm text-foreground">Delinquency Risk Scoring Sheet</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                      <th className="px-6 py-3">Resident</th>
                      <th className="px-6 py-3">Roll Number</th>
                      <th className="px-6 py-3 text-center">Overdue Invoices</th>
                      <th className="px-6 py-3 text-center">Past Late Payments</th>
                      <th className="px-6 py-3 text-center">Risk Score</th>
                      <th className="px-6 py-3 text-right">Delinquency Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {fees.risks.map((risk, idx) => (
                      <tr key={idx} className="hover:bg-secondary/15">
                        <td className="px-6 py-3 font-bold text-foreground/80">{risk.name}</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground">{risk.rollNumber}</td>
                        <td className="px-6 py-3 text-center font-semibold text-foreground/80">{risk.pendingOverdue}</td>
                        <td className="px-6 py-3 text-center text-muted-foreground">{risk.pastLateCount}</td>
                        <td className="px-6 py-3 text-center font-bold text-primary">{risk.score}%</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            risk.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                            risk.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {risk.riskLevel} RISK
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Risk profiling */}
          {activeTab === 'ATTENDANCE' && attendance && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm page-fade">
              <div className="px-6 py-4 border-b border-border bg-muted/10">
                <h3 className="font-bold text-sm text-foreground">Attendance Mismatch & Alert Profiles</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                      <th className="px-6 py-3">Resident</th>
                      <th className="px-6 py-3">Roll Number</th>
                      <th className="px-6 py-3 text-center">30D Attendance Rate</th>
                      <th className="px-6 py-3 text-center">Consecutive Absences</th>
                      <th className="px-6 py-3 text-center">Anomalous Score</th>
                      <th className="px-6 py-3 text-right">Welfare Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {attendance.risks.map((risk, idx) => (
                      <tr key={idx} className="hover:bg-secondary/15">
                        <td className="px-6 py-3 font-bold text-foreground/80">{risk.name}</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground">{risk.rollNumber}</td>
                        <td className="px-6 py-3 text-center font-bold text-foreground/75">{risk.attendanceRate}%</td>
                        <td className="px-6 py-3 text-center text-red-500 font-semibold">{risk.consecutiveAbsents} Days</td>
                        <td className="px-6 py-3 text-center font-bold text-primary">{risk.score}%</td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            risk.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                            risk.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {risk.riskLevel === 'HIGH' ? 'URGENT REVIEW' : risk.riskLevel === 'MEDIUM' ? 'MONITOR' : 'STABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsInsights;
