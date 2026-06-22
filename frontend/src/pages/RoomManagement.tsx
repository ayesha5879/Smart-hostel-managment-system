import React, { useEffect, useState } from 'react';
import { Home, Plus, Users, ShieldAlert, ArrowLeftRight, Trash2, Key, Loader2, Check } from 'lucide-react';
import api from '../services/api';

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  building: string;
  capacity: number;
  roomType: string;
  baseFee: number;
  isMaintenance: boolean;
  occupiedBeds: number;
  availableBeds: number;
  roomAllocations: Array<{
    id: string;
    studentId: string;
    student: {
      id: string;
      studentId: string;
      user: { name: string; email: string };
    };
  }>;
}

interface Student {
  id: string;
  studentId: string;
  user: { name: string };
}

const RoomManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  // Form states
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState(1);
  const [building, setBuilding] = useState('Block A');
  const [capacity, setCapacity] = useState(2);
  const [roomType, setRoomType] = useState('DOUBLE');
  const [baseFee, setBaseFee] = useState(150);

  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocRoomId, setAllocRoomId] = useState('');
  
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferRoomId, setTransferRoomId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
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
    fetchRooms();
    fetchStudents();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/rooms', {
        roomNumber,
        floor: Number(floor),
        building,
        capacity: Number(capacity),
        roomType,
        baseFee: Number(baseFee)
      });
      setShowAddRoom(false);
      // Reset form
      setRoomNumber('');
      setFloor(1);
      setBaseFee(150);
      fetchRooms();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/rooms/allocate', {
        studentId: allocStudentId,
        roomId: allocRoomId
      });
      setShowAllocate(false);
      setAllocStudentId('');
      setAllocRoomId('');
      fetchRooms();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Allocation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await api.post('/rooms/transfer', {
        studentId: transferStudentId,
        roomId: transferRoomId
      });
      setShowTransfer(false);
      setTransferStudentId('');
      setTransferRoomId('');
      fetchRooms();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVacate = async (allocationId: string) => {
    if (!window.confirm('Are you sure you want to vacate this bed?')) return;
    try {
      await api.post('/rooms/vacate', { allocationId });
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Room Allocations Control</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage room inventories, run transfer requests, and inspect resident beds.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowTransfer(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 font-semibold rounded-xl text-sm border border-border transition-colors">
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
          <button onClick={() => setShowAllocate(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground hover:bg-secondary/80 font-semibold rounded-xl text-sm border border-border transition-colors">
            <Key className="w-4 h-4" /> Assign Bed
          </button>
          <button onClick={() => setShowAddRoom(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-primary/10">
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      {/* Grid of rooms */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div key={room.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
              {/* Header card */}
              <div className="p-6 border-b border-border/60">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Room {room.roomNumber}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{room.building} | Floor {room.floor}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    room.isMaintenance ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    room.occupiedBeds >= room.capacity ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {room.isMaintenance ? 'MAINTENANCE' : room.occupiedBeds >= room.capacity ? 'FULL' : 'AVAILABLE'}
                  </span>
                </div>
                
                {/* Stats */}
                <div className="mt-4 flex gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Type</span>
                    <span className="text-foreground">{room.roomType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Monthly Rent</span>
                    <span className="text-foreground">${room.baseFee}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Beds Occupied</span>
                    <span className="text-foreground">{room.occupiedBeds} / {room.capacity}</span>
                  </div>
                </div>
              </div>

              {/* Occupants list */}
              <div className="p-6 flex-1 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Occupants</h4>
                {room.roomAllocations.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No residents assigned.</p>
                ) : (
                  <div className="space-y-3">
                    {room.roomAllocations.map((a) => (
                      <div key={a.id} className="flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-foreground truncate">{a.student.user.name}</h5>
                          <p className="text-[10px] text-muted-foreground">{a.student.studentId}</p>
                        </div>
                        <button
                          onClick={() => handleVacate(a.id)}
                          className="text-[10px] font-semibold text-red-500 hover:bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
                        >
                          Vacate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden page-fade text-left">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Add New Room</h3>
              <button onClick={() => setShowAddRoom(false)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Room Number</label>
                <input type="text" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-primary" placeholder="e.g. 101, A203" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Floor</label>
                  <input type="number" required value={floor} onChange={(e) => setFloor(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" min={1} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Building</label>
                  <select value={building} onChange={(e) => setBuilding(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none">
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Capacity (Beds)</label>
                  <input type="number" required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" min={1} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-semibold">Room Type</label>
                  <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none">
                    <option value="SINGLE">Single</option>
                    <option value="DOUBLE">Double</option>
                    <option value="TRIPLE">Triple</option>
                    <option value="DORMITORY">Dormitory</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Base Fee Monthly (USD)</label>
                <input type="number" required value={baseFee} onChange={(e) => setBaseFee(Number(e.target.value))} className="w-full bg-secondary/30 border border-border rounded-xl py-2 px-3 text-sm focus:outline-none" min={0} />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 p-4 bg-muted/10">
                <button type="button" onClick={() => setShowAddRoom(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 shadow-md shadow-primary/10">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Bed Modal */}
      {showAllocate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden page-fade text-left">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Allocate Bed to Student</h3>
              <button onClick={() => setShowAllocate(false)} className="text-xs font-semibold text-muted-foreground">Close</button>
            </div>
            <form onSubmit={handleAllocate} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Select Student</label>
                <select required value={allocStudentId} onChange={(e) => setAllocStudentId(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none">
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.user.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Target Room</label>
                <select required value={allocRoomId} onChange={(e) => setAllocRoomId(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none">
                  <option value="">-- Choose Room --</option>
                  {rooms.filter(r => !r.isMaintenance && r.occupiedBeds < r.capacity).map(r => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.building}) - Floor {r.floor} [{r.occupiedBeds}/{r.capacity} beds filled]</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 p-4 bg-muted/10">
                <button type="button" onClick={() => setShowAllocate(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 shadow-md">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {showTransfer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden page-fade text-left">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
              <h3 className="font-bold text-base text-foreground">Transfer Resident</h3>
              <button onClick={() => setShowTransfer(false)} className="text-xs font-semibold text-muted-foreground">Close</button>
            </div>
            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              {errorMsg && <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs py-2 px-3 rounded-xl font-semibold">{errorMsg}</div>}
              
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">Select Resident</label>
                <select required value={transferStudentId} onChange={(e) => setTransferStudentId(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none">
                  <option value="">-- Choose Resident --</option>
                  {rooms.flatMap(r => r.roomAllocations).map(a => (
                    <option key={a.student.id} value={a.student.id}>{a.student.user.name} ({a.student.studentId})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-semibold">New Room Location</label>
                <select required value={transferRoomId} onChange={(e) => setTransferRoomId(e.target.value)} className="w-full bg-secondary/30 border border-border rounded-xl py-2.5 px-3 text-sm focus:outline-none">
                  <option value="">-- Choose Target Room --</option>
                  {rooms.filter(r => !r.isMaintenance && r.occupiedBeds < r.capacity).map(r => (
                    <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.building}) [{r.occupiedBeds}/{r.capacity} beds filled]</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-2 -mx-6 -mb-6 p-4 bg-muted/10">
                <button type="button" onClick={() => setShowTransfer(false)} className="px-4 py-2 border border-border text-sm font-semibold rounded-xl text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/95 shadow-md">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
