import React, { useEffect, useState } from 'react';
import { CreditCard, Search, Download, CheckCircle2, AlertCircle, Plus, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

interface Fee {
  id: string;
  amount: number;
  utilityCharges: number;
  securityDeposit: number;
  miscCharges: number;
  lateFee: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  billingPeriod: string;
  student: {
    id: string;
    studentId: string;
    user: { name: string; email: string };
  };
  roomAllocation: { room: { roomNumber: string; building: string } };
}

interface Student {
  id: string;
  studentId: string;
  user: { name: string };
}

const BillingInvoices: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [userRole, setUserRole] = useState('');

  // Modals
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Forms
  const [formStudentId, setFormStudentId] = useState('');
  const [formPeriod, setFormPeriod] = useState('June 2026');
  const [formDueDate, setFormDueDate] = useState('');
  const [formUtility, setFormUtility] = useState(0);
  const [formDeposit, setFormDeposit] = useState(0);
  const [formMisc, setFormMisc] = useState(0);

  const [payFeeId, setPayFeeId] = useState('');
  const [payMethod, setPayMethod] = useState('ONLINE');
  const [payTxnRef, setPayTxnRef] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchFees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/fees?${params.toString()}`);
      setFees(res.data);
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
    fetchFees();
    fetchStudents();
  }, [statusFilter]);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/fees', {
        studentId: formStudentId,
        billingPeriod: formPeriod,
        dueDate: formDueDate,
        utilityCharges: Number(formUtility),
        securityDeposit: Number(formDeposit),
        miscCharges: Number(formMisc)
      });
      setShowAddInvoice(false);
      // Reset form
      setFormStudentId('');
      setFormUtility(0);
      setFormDeposit(0);
      setFormMisc(0);
      fetchFees();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/fees/pay', {
        feeId: payFeeId,
        paymentMethod: payMethod,
        transactionReference: payTxnRef
      });
      setShowPayModal(false);
      setPayFeeId('');
      setPayTxnRef('');
      fetchFees();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Payment logging failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = (feeId: string, billingPeriod: string) => {
    const token = localStorage.getItem('accessToken');
    // We can directly open the PDF API route in a new tab with authorization token appended
    // or trigger download in current window
    const link = document.createElement('a');
    link.href = `/api/fees/${feeId}/pdf`;
    link.setAttribute('download', `Invoice-${billingPeriod.replace(' ', '_')}.pdf`);
    // We need to fetch it via axios to pass auth headers, then convert response to blob and download
    api.get(`/fees/${feeId}/pdf`, { responseType: 'blob' })
      .then((res) => {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => console.error('Error downloading invoice pdf', err));
  };

  return (
    <div className="space-y-6">
      {/* Controls header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Financial Ledger</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Generate invoices, verify transactions, and download official PDF receipts.</p>
          </div>
        </div>
        {userRole !== 'STUDENT' && userRole !== 'WARDEN' && (
          <button onClick={() => setShowAddInvoice(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/10">
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border px-4 py-2 text-sm rounded-xl focus:outline-none focus:border-primary transition-all"
        >
          <option value="">All Invoice Statuses</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Invoices List */}
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
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Billing Period</th>
                  <th className="px-6 py-4">Room Location</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {fees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  fees.map((fee) => {
                    const total = fee.amount + fee.utilityCharges + fee.securityDeposit + fee.miscCharges + fee.lateFee;
                    return (
                      <tr key={fee.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{fee.student.user.name}</div>
                          <div className="text-xs text-muted-foreground">{fee.student.studentId}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground/80">{fee.billingPeriod}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          Room {fee.roomAllocation?.room?.roomNumber || 'N/A'} ({fee.roomAllocation?.room?.building || 'N/A'})
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">${total.toFixed(2)}</td>
                        <td className="px-6 py-4 text-muted-foreground">{new Date(fee.dueDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            fee.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            fee.status === 'OVERDUE' ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {fee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {fee.status !== 'PAID' && (
                              <button
                                onClick={() => { setPayFeeId(fee.id); setShowPayModal(true); }}
                                className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors"
                              >
                                Record Payment
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadPdf(fee.id, fee.billingPeriod)}
                              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
                              title="Download PDF Invoice"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden page-fade text-left">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Generate Student Invoice</h3>
              <button onClick={() => setShowAddInvoice(false)} className="text-xs font-semibold text-muted-foreground">Close</button>
            </div>
            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Select Student</label>
                <select required value={formStudentId} onChange={(e) => setFormStudentId(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none">
                  <option value="">-- Choose Resident --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.user.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Billing Period</label>
                  <input type="text" required value={formPeriod} onChange={(e) => setFormPeriod(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" placeholder="June 2026" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Due Date</label>
                  <input type="date" required value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Utility Fee</label>
                  <input type="number" value={formUtility} onChange={(e) => setFormUtility(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-2 text-sm focus:outline-none" min={0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Security Dep</label>
                  <input type="number" value={formDeposit} onChange={(e) => setFormDeposit(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-2 text-sm focus:outline-none" min={0} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Misc Fee</label>
                  <input type="number" value={formMisc} onChange={(e) => setFormMisc(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-2 text-sm focus:outline-none" min={0} />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 p-4 bg-muted/10">
                <button type="button" onClick={() => setShowAddInvoice(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 shadow-md">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden page-fade text-left">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Record Payment Receipt</h3>
              <button onClick={() => setShowPayModal(false)} className="text-xs font-semibold text-muted-foreground">Close</button>
            </div>
            <form onSubmit={handlePayInvoice} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none">
                  <option value="ONLINE">Online Portal</option>
                  <option value="CARD">Debit/Credit Card</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="CASH">Cash Deposit</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Transaction Reference ID</label>
                <input type="text" required value={payTxnRef} onChange={(e) => setPayTxnRef(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none" placeholder="e.g. TXN-9843-REF" />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 p-4 bg-muted/10">
                <button type="button" onClick={() => setShowPayModal(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-550 shadow-md">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Payment SUCCESS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingInvoices;
