import React, { useEffect, useState } from 'react';
import { Users, Search, Plus, Edit2, Trash2, ArrowUpRight, Loader2, Download } from 'lucide-react';
import api from '../services/api';

interface Student {
  id: string;
  studentId: string;
  cnic: string;
  gender: string;
  department: string;
  semester: number;
  phone: string;
  emergencyContact: string;
  address: string;
  status: 'ACTIVE' | 'VACATED';
  user: { name: string; email: string };
  guardian: { name: string; contactNumber: string };
  roomAllocations: Array<{ room: { roomNumber: string } }>;
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formGender, setFormGender] = useState('Male');
  const [formDept, setFormDept] = useState('Computer Science');
  const [formSemester, setFormSemester] = useState(1);
  const [formPhone, setFormPhone] = useState('');
  const [formEmergency, setFormEmergency] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianRelation, setFormGuardianRelation] = useState('Father');
  const [formGuardianContact, setFormGuardianContact] = useState('');
  const [formGuardianCnic, setFormGuardianCnic] = useState('');
  const [formGuardianAddress, setFormGuardianAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deptFilter) params.append('department', deptFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/students?${params.toString()}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, deptFilter, statusFilter]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/students', {
        email: formEmail,
        password: formPassword,
        name: formName,
        studentId: formRoll,
        cnic: formCnic,
        gender: formGender,
        department: formDept,
        semester: Number(formSemester),
        phone: formPhone,
        emergencyContact: formEmergency,
        address: formAddress,
        guardianName: formGuardianName,
        guardianRelation: formGuardianRelation,
        guardianContact: formGuardianContact,
        guardianCnic: formGuardianCnic,
        guardianAddress: formGuardianAddress
      });

      setShowAddModal(false);
      // Reset form
      setFormEmail('');
      setFormPassword('');
      setFormName('');
      setFormRoll('');
      setFormCnic('');
      setFormPhone('');
      setFormEmergency('');
      setFormAddress('');
      setFormGuardianName('');
      setFormGuardianContact('');
      setFormGuardianCnic('');
      setFormGuardianAddress('');

      fetchStudents();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student profile permanently?')) return;
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(students, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "student_registry.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Student Registries</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage records, export datasets, and register active occupancies.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleExportData}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 font-semibold rounded-xl text-sm border border-border transition-colors"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/10"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search roll, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border pl-10 pr-4 py-2 text-sm rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Dept Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-card border border-border px-4 py-2 text-sm rounded-xl focus:outline-none focus:border-primary transition-all"
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Software Engineering">Software Engineering</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Business Admin">Business Admin</option>
          <option value="Data Science">Data Science</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border px-4 py-2 text-sm rounded-xl focus:outline-none focus:border-primary transition-all"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="VACATED">Vacated</option>
        </select>
      </div>

      {/* Table Listing */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No student records found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-foreground/80">{student.studentId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-foreground">{student.user.name}</div>
                          <div className="text-xs text-muted-foreground">{student.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{student.department}</td>
                      <td className="px-6 py-4">Semester {student.semester}</td>
                      <td className="px-6 py-4">
                        {student.roomAllocations.find(a => a.room) ? (
                          <span className="font-bold text-primary bg-primary/5 border border-primary/15 px-2.5 py-0.5 rounded-full text-xs">
                            Room {student.roomAllocations[0].room.roomNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          student.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                            : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="p-1.5 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col page-fade">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Add New Student Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Close</button>
            </div>
            
            <form onSubmit={handleAddStudent} className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-3 px-4 rounded-xl font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Login Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Account Credentials</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Email Address</label>
                    <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="student@university.edu" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Password</label>
                    <input type="password" required value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Academic Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Full Name</label>
                    <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary" placeholder="Emma Watson" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Roll Number</label>
                    <input type="text" required value={formRoll} onChange={(e) => setFormRoll(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary" placeholder="ROLL-2026-1002" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">CNIC / Passport</label>
                    <input type="text" required value={formCnic} onChange={(e) => setFormCnic(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary" placeholder="35202-0000000-1" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Gender</label>
                    <select value={formGender} onChange={(e) => setFormGender(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Department</label>
                    <select value={formDept} onChange={(e) => setFormDept(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary">
                      <option value="Computer Science">Computer Science</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Business Admin">Business Admin</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Semester</label>
                    <input type="number" required value={formSemester} onChange={(e) => setFormSemester(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" min={1} max={12} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Phone Number</label>
                    <input type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="+1-555-12345" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Emergency Contact</label>
                    <input type="text" required value={formEmergency} onChange={(e) => setFormEmergency(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="+1-555-98765" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Home Address</label>
                  <textarea required value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Residential location details..." rows={2} />
                </div>
              </div>

              {/* Guardian Info */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Guardian Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Guardian Full Name</label>
                    <input type="text" required value={formGuardianName} onChange={(e) => setFormGuardianName(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Full Name" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Relation</label>
                    <select value={formGuardianRelation} onChange={(e) => setFormGuardianRelation(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Guardian Phone</label>
                    <input type="text" required value={formGuardianContact} onChange={(e) => setFormGuardianContact(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Phone" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground font-semibold">Guardian CNIC</label>
                    <input type="text" required value={formGuardianCnic} onChange={(e) => setFormGuardianCnic(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="CNIC Number" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Guardian Address</label>
                  <textarea required value={formGuardianAddress} onChange={(e) => setFormGuardianAddress(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Address..." rows={2} />
                </div>
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-border flex justify-end gap-2 bg-muted/10 p-4 -mx-6 -mb-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground hover:text-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 flex items-center gap-1 shadow-md shadow-primary/10">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
