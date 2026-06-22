import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Check, LogOut, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

interface Visitor {
  id: string;
  name: string;
  cnic: string;
  contactNumber: string;
  relation: string;
  purpose: string;
  checkInTime: string;
  checkOutTime: string | null;
  securityPassCode: string;
  qrCodeToken: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT';
  student: { studentId: string; user: { name: string } };
  approvedBy: { name: string } | null;
}

const VisitorManagement: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPass, setSelectedPass] = useState<Visitor | null>(null);

  // Forms
  const [formName, setFormName] = useState('');
  const [formCnic, setFormCnic] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRelation, setFormRelation] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formPurpose, setFormPurpose] = useState('');

  const [gateCode, setGateCode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/visitors');
      setVisitors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      setUserRole(user.role);
    }
    fetchVisitors();
  }, []);

  const handleRegisterVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/visitors/register', {
        name: formName,
        cnic: formCnic,
        contactNumber: formPhone,
        relation: formRelation,
        studentRollNumber: formRoll,
        purpose: formPurpose
      });
      setShowAddModal(false);
      // Reset form
      setFormName('');
      setFormCnic('');
      setFormPhone('');
      setFormRelation('');
      setFormRoll('');
      setFormPurpose('');
      fetchVisitors();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/visitors/${id}/approve`);
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/visitors/check-in', { passCode: gateCode });
      setGateCode('');
      fetchVisitors();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/visitors/check-out', { passCode: gateCode });
      setGateCode('');
      fetchVisitors();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Check-out failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Visitor Registries & Passes</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Approve entry requests, track gate check-ins, and inspect security passes.</p>
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/10">
          <Plus className="w-4 h-4" /> Request Guest Pass
        </button>
      </div>

      {/* Gate Controls (Warden/Manager only) */}
      {userRole !== 'STUDENT' && (
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-sm text-foreground">Security Gate Check-In/Out Desk</h3>
          {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold max-w-md">{errorMsg}</div>}
          <form className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs text-muted-foreground font-semibold">Verify Pass Code</label>
              <input
                type="text"
                placeholder="e.g. PASS-200001"
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleCheckIn} className="flex-1 sm:flex-none px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center gap-1.5 justify-center">
                <Check className="w-4 h-4" /> Log Enter
              </button>
              <button onClick={handleCheckOut} className="flex-1 sm:flex-none px-5 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 border border-border font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5 justify-center">
                <LogOut className="w-4 h-4" /> Log Exit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visitors Table */}
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
                  <th className="px-6 py-4">Visitor</th>
                  <th className="px-6 py-4">Student Visited</th>
                  <th className="px-6 py-4">Relation</th>
                  <th className="px-6 py-4">Security Pass</th>
                  <th className="px-6 py-4">Check-In</th>
                  <th className="px-6 py-4">Check-Out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">No visitor records reported.</td>
                  </tr>
                ) : (
                  visitors.map((v) => (
                    <tr key={v.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground">CNIC: {v.cnic}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground/80">{v.student.user.name}</div>
                        <div className="text-[10px] text-muted-foreground">Roll: {v.student.studentId}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{v.relation}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-xs bg-secondary px-2.5 py-1 rounded-lg border border-border">
                          {v.securityPassCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {v.checkInTime ? new Date(v.checkInTime).toLocaleString() : 'Pending gate'}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : 'On premises'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          v.status === 'CHECKED_OUT' ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                          v.status === 'CHECKED_IN' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-pulse' :
                          v.status === 'APPROVED' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {userRole !== 'STUDENT' && v.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(v.id)}
                              className="px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPass(v)}
                            className="px-2 py-1 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors"
                          >
                            View Pass
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

      {/* Request Guest Pass Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden page-fade text-left">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Request Guest Entry Pass</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs font-semibold text-muted-foreground">Close</button>
            </div>
            <form onSubmit={handleRegisterVisitor} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold">{errorMsg}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Visitor Name</label>
                  <input type="text" required value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Guest Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">CNIC / Passport</label>
                  <input type="text" required value={formCnic} onChange={(e) => setFormCnic(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="35201-0000000-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Phone Number</label>
                  <input type="text" required value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Contact number" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Relation</label>
                  <input type="text" required value={formRelation} onChange={(e) => setFormRelation(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="e.g. Father, Friend" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Student Roll to Visit</label>
                <input type="text" required value={formRoll} onChange={(e) => setFormRoll(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="e.g. ROLL-2026-1002" />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Purpose of Visit</label>
                <input type="text" required value={formPurpose} onChange={(e) => setFormPurpose(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="Reason details..." />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 p-4 bg-muted/10">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 shadow-md">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Visitor Pass Card Modal */}
      {selectedPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl shadow-xl overflow-hidden page-fade text-left relative">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary to-indigo-600 text-white">
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">CLARIA VISITOR GATEPASS</h3>
                <p className="text-[10px] text-white/80 font-medium">Secured Verification Identity</p>
              </div>
              <button onClick={() => setSelectedPass(null)} className="text-xs font-semibold text-white/90 hover:text-white">Close</button>
            </div>
            
            <div className="p-6 flex flex-col items-center space-y-6">
              {/* Simulated QR Code Box */}
              <div className="w-44 h-44 bg-slate-100 dark:bg-slate-900 border-2 border-border/80 rounded-2xl flex flex-col items-center justify-center p-4 relative">
                {/* QR lines pattern */}
                <div className="grid grid-cols-4 gap-2 opacity-80">
                  <div className="w-8 h-8 bg-foreground rounded" />
                  <div className="w-8 h-8 bg-transparent" />
                  <div className="w-8 h-8 bg-foreground rounded" />
                  <div className="w-8 h-8 bg-foreground rounded" />
                  
                  <div className="w-8 h-8 bg-foreground rounded" />
                  <div className="w-8 h-8 bg-foreground rounded" />
                  <div className="w-8 h-8 bg-transparent" />
                  <div className="w-8 h-8 bg-foreground rounded" />

                  <div className="w-8 h-8 bg-transparent" />
                  <div className="w-8 h-8 bg-foreground rounded" />
                  <div className="w-8 h-8 bg-foreground rounded" />
                  <div className="w-8 h-8 bg-transparent" />
                </div>
                <span className="absolute bottom-2 font-mono text-[9px] text-muted-foreground/60 tracking-wider">
                  {selectedPass.qrCodeToken.substring(0, 16)}
                </span>
              </div>

              {/* Pass details */}
              <div className="w-full space-y-3 bg-secondary/35 p-4 rounded-2xl border border-border/60">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">Guest Name</span>
                    <span className="font-extrabold text-foreground">{selectedPass.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">CNIC</span>
                    <span className="font-extrabold text-foreground">{selectedPass.cnic}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">Student Visited</span>
                    <span className="font-bold text-foreground/80">{selectedPass.student.user.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">Pass Code</span>
                    <span className="font-mono font-bold text-primary">{selectedPass.securityPassCode}</span>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground leading-snug pt-2 border-t border-border/60">
                  <span className="font-bold block uppercase text-[9px] text-muted-foreground">Purpose</span>
                  {selectedPass.purpose}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorManagement;
