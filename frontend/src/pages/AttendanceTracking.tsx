import React, { useEffect, useState } from 'react';
import { CalendarCheck, Clock, Check, X, ShieldAlert, Loader2, ArrowRight, Camera } from 'lucide-react';
import api from '../services/api';

interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime: string | null;
  qrScanned: boolean;
  student: {
    studentId: string;
    user: { name: string };
  };
}

interface Student {
  id: string;
  studentId: string;
  user: { name: string };
}

const AttendanceTracking: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  // States
  const [targetDate, setTargetDate] = useState(new Date().toISOString().substring(0, 10));
  const [manualMarks, setManualMarks] = useState<{ [key: string]: 'PRESENT' | 'ABSENT' | 'LATE' }>({});

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?date=${targetDate}`);
      setAttendance(res.data);
      
      // Auto populate manualMarks state
      const marks: { [key: string]: 'PRESENT' | 'ABSENT' | 'LATE' } = {};
      res.data.forEach((att: Attendance) => {
        marks[att.studentId] = att.status;
      });
      setManualMarks(marks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students?status=ACTIVE');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserRole(user.role);
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [targetDate]);

  const handleMarkChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setManualMarks(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setErrorMsg('');

    try {
      const records = Object.keys(manualMarks).map(studentId => ({
        studentId,
        status: manualMarks[studentId]
      }));

      await api.post('/attendance/manual', {
        date: targetDate,
        records
      });

      setMessage('Attendance sheet saved successfully!');
      fetchAttendance();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit attendance sheet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateQRScan = async () => {
    setSubmitting(true);
    setMessage('');
    setErrorMsg('');

    try {
      const res = await api.post('/attendance/qr-scan', {
        qrToken: 'AEGIS-GATE-CORRIDOR-2026'
      });
      setMessage(`QR Attendance Registered: ${res.data.status}`);
      fetchAttendance();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'QR Scan authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Attendance Logs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Track daily check-ins, run automated QR scanner entries, and inspect nightly sheets.</p>
          </div>
        </div>
        {userRole === 'STUDENT' && (
          <button
            onClick={handleSimulateQRScan}
            disabled={submitting}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/10"
          >
            <Camera className="w-4 h-4" /> Simulate QR Check-In
          </button>
        )}
      </div>

      {message && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs py-3 px-4 rounded-xl font-semibold">{message}</div>}
      {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-xl font-semibold">{errorMsg}</div>}

      {userRole !== 'STUDENT' ? (
        /* Staff manual attendance sheet manager */
        <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border/60 pb-4">
            <h3 className="font-bold text-sm text-foreground">Manual Attendance Register</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-semibold">Sheet Date:</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-secondary/40 border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
            </div>
          </div>

          <form onSubmit={handleSubmitAttendance} className="space-y-6">
            <div className="overflow-x-auto border border-border/60 rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground uppercase">
                    <th className="px-6 py-3">Resident</th>
                    <th className="px-6 py-3">Roll Number</th>
                    <th className="px-6 py-3 text-center">Mark Present</th>
                    <th className="px-6 py-3 text-center">Mark Late</th>
                    <th className="px-6 py-3 text-center">Mark Absent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {students.map((stud) => {
                    const currentMark = manualMarks[stud.id] || 'ABSENT';
                    return (
                      <tr key={stud.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-3 font-bold text-foreground/80">{stud.user.name}</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground">{stud.studentId}</td>
                        <td className="px-6 py-3 text-center">
                          <input
                            type="radio"
                            name={`att-${stud.id}`}
                            checked={currentMark === 'PRESENT'}
                            onChange={() => handleMarkChange(stud.id, 'PRESENT')}
                            className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                          />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <input
                            type="radio"
                            name={`att-${stud.id}`}
                            checked={currentMark === 'LATE'}
                            onChange={() => handleMarkChange(stud.id, 'LATE')}
                            className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                          />
                        </td>
                        <td className="px-6 py-3 text-center">
                          <input
                            type="radio"
                            name={`att-${stud.id}`}
                            checked={currentMark === 'ABSENT'}
                            onChange={() => handleMarkChange(stud.id, 'ABSENT')}
                            className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/60">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-lg shadow-primary/10 hover:bg-primary/95 flex items-center gap-1.5"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Attendance sheet'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Student Attendance view log */
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-foreground">My Attendance History Calendar</h3>
          
          <div className="overflow-x-auto border border-border/60 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-6 py-3">Register Date</th>
                  <th className="px-6 py-3">Check-In Time</th>
                  <th className="px-6 py-3">Verification Method</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-muted-foreground">No attendance logs available yet.</td>
                  </tr>
                ) : (
                  attendance.map((att) => (
                    <tr key={att.id} className="hover:bg-secondary/15">
                      <td className="px-6 py-3 font-semibold">{new Date(att.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : 'N/A'}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {att.qrScanned ? 'QR Code Scanned' : 'Manual Entry'}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          att.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          att.status === 'LATE' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;
