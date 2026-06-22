import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, CreditCard, ShieldAlert, Users, CalendarCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface StudentProfile {
  id: string;
  studentId: string;
  department: string;
  semester: number;
  roomAllocations: Array<{
    id: string;
    isActive: boolean;
    room: {
      id: string;
      roomNumber: string;
      building: string;
      floor: number;
      roomType: string;
      baseFee: number;
      roomAllocations: Array<{
        id: string;
        student: { id: string; user: { name: string; email: string } };
      }>;
    };
  }>;
  fees: Array<{
    id: string;
    amount: number;
    utilityCharges: number;
    miscCharges: number;
    lateFee: number;
    status: string;
    billingPeriod: string;
    dueDate: string;
  }>;
  attendance: Array<{
    date: string;
    status: string;
  }>;
}

const StudentDashboard: React.FC = () => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        if (user && user.studentProfileId) {
          const res = await api.get(`/students/${user.studentProfileId}`);
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Error fetching student dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-border">
        <h3 className="font-bold text-lg">No Profile Registered</h3>
        <p className="text-sm text-muted-foreground mt-1">Contact Hostel Administration to register your student details.</p>
      </div>
    );
  }

  // Get active room allocation details
  const activeAlloc = profile.roomAllocations.find(a => a.isActive);
  const room = activeAlloc?.room;
  const roommates = room?.roomAllocations.filter(a => a.student.id !== profile.id) || [];

  // Get latest fee invoice
  const latestFee = profile.fees[0];
  const totalDue = latestFee ? (latestFee.amount + latestFee.utilityCharges + latestFee.miscCharges + latestFee.lateFee) : 0;

  // Attendance metrics
  const totalAttendance = profile.attendance.length;
  const presentCount = profile.attendance.filter(a => a.status === 'PRESENT').length;
  const lateCount = profile.attendance.filter(a => a.status === 'LATE').length;
  // Late counts as 0.75 present
  const attendanceRate = totalAttendance > 0 ? Math.round(((presentCount + lateCount * 0.75) / totalAttendance) * 100) : 100;

  return (
    <div className="space-y-8 page-fade">
      {/* Overview Greeting */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome Back to Aegis Hostels</h1>
          <p className="text-sm text-muted-foreground mt-1">Roll Number: {profile.studentId} | Dept: {profile.department} (Semester {profile.semester})</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl items-center">
          <CheckCircle2 className="w-4 h-4" /> Residency Active
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Room card */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-4 rounded-2xl">
            <Home className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">My Allocated Room</span>
            {room ? (
              <h3 className="text-2xl font-extrabold tracking-tight mt-0.5">{room.roomNumber} ({room.building})</h3>
            ) : (
              <h3 className="text-lg font-bold text-red-500 mt-0.5">Not Assigned</h3>
            )}
          </div>
        </div>

        {/* Fees status */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Current Fee Status</span>
            {latestFee ? (
              <h3 className="text-2xl font-extrabold tracking-tight mt-0.5 flex items-center gap-2">
                ${totalDue.toFixed(2)}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  latestFee.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'
                }`}>
                  {latestFee.status}
                </span>
              </h3>
            ) : (
              <h3 className="text-lg font-bold text-muted-foreground mt-0.5">No Invoices</h3>
            )}
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="bg-indigo-500/10 text-indigo-500 p-4 rounded-2xl">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Attendance Rate</span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-0.5">{attendanceRate}%</h3>
          </div>
        </div>
      </div>

      {/* Details split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Roommates information */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Roommate Directory</h3>
          <div className="space-y-4">
            {roommates.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No roommates currently sharing this room.
              </div>
            ) : (
              roommates.map((rm) => (
                <div key={rm.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {rm.student.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{rm.student.user.name}</h4>
                    <p className="text-xs text-muted-foreground">{rm.student.user.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Help desk */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-base text-foreground">Quick Action Shortcuts</h3>
          <div className="grid grid-cols-2 gap-4">
            <NavLink to="/complaints" className="p-4 bg-secondary/40 border border-border hover:bg-secondary/80 rounded-xl transition-all flex flex-col justify-between h-28">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              <div>
                <h4 className="text-xs font-bold text-foreground">File Complaint</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Report room issues directly.</p>
              </div>
            </NavLink>
            <NavLink to="/visitors" className="p-4 bg-secondary/40 border border-border hover:bg-secondary/80 rounded-xl transition-all flex flex-col justify-between h-28">
              <Users className="w-6 h-6 text-indigo-500" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Visitor Passes</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">Generate QR code entry pass.</p>
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
