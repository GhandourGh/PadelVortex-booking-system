"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, Plus, Calendar, Target, Edit, Trash2, Save, X, MoreVertical, FileDown, ChevronRight, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";
// @ts-ignore - type export name
import autoTable from "jspdf-autotable";
import Link from "next/link";

type Booking = {
  id: string;
  court: "Court A" | "Court B";
  start_at: string;
  end_at: string;
  name: string;
  phone: string;
  status: string;
  inserted_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which action is loading
  
  // Date helper function (same as booking page)
  const nextNDates = (n = 14) => {
    const out: { label: string; full: string; iso: string; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const wd = d.toLocaleDateString(undefined, { weekday: "short" });
      const day = d.toLocaleDateString(undefined, { day: "2-digit" });
      const mon = d.toLocaleDateString(undefined, { month: "short" });
      out.push({
        label: `${wd} ${day} ${mon}`,
        full: d.toLocaleDateString(),
        iso: d.toISOString().slice(0, 10),
        isToday: i === 0,
      });
    }
    return out;
  };

  // Filters
  const [dateFilter, setDateFilter] = useState<string>(nextNDates()[0].iso);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [courtFilter, setCourtFilter] = useState<"Court A" | "Court B">("Court A");
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});
  
  // Add new booking
  const [showAddForm, setShowAddForm] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [rangeModal, setRangeModal] = useState<{ open: boolean; from: string; to: string }>({ open: false, from: "", to: "" });
  const [addForm, setAddForm] = useState({
    court: "Court A" as "Court A" | "Court B",
    date: "",
    startTime: "",
    duration: 60,
    name: "",
    phone: "",
  });

  // Load bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: pagination.page.toString(), limit: pagination.limit.toString() });
      if (!showAllBookings && dateFilter) params.append("date", dateFilter);
      if (courtFilter) params.append("court", courtFilter);
      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to load bookings (${res.status})`);
      }
      const data = await res.json();
      setBookings(data.bookings);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, dateFilter, courtFilter, showAllBookings]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Format helpers
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Export PDF helpers
  const exportToPdf = (rows: Booking[], opts?: { rangeLabel?: string }) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const title = 'Vortex Padel — Bookings Report';
    const meta = `${opts?.rangeLabel ?? (showAllBookings ? 'All dates' : dateFilter)} • ${courtFilter} • ${new Date().toLocaleString()}`;
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.text(title, 40, 40);
    doc.setFontSize(10); doc.text(meta, 40, 58);
    const body = rows.map((b) => {
      const date = new Date(b.start_at).toLocaleDateString();
      const time = `${new Date(b.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${new Date(b.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      return [date, time, b.court, b.name, b.phone, b.status];
    });
    autoTable(doc as any, {
      startY: 74,
      head: [['Date','Time','Court','Name','Phone','Status']],
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [37,99,235] },
      didDrawPage: () => {
        const pageNo = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(`Page ${pageNo}`, pageW - 60, doc.internal.pageSize.getHeight() - 16);
      },
    });
    doc.save(`bookings_${showAllBookings ? 'all' : dateFilter}_${courtFilter.replace(/\s+/g,'')}.pdf`);
  };

  // Edit booking
  const startEdit = (booking: Booking) => {
    setEditingId(booking.id);
    setEditForm({
      court: booking.court,
      start_at: booking.start_at,
      end_at: booking.end_at,
      name: booking.name,
      phone: booking.phone,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setActionLoading(editingId);
    try {
      const res = await fetch(`/api/admin/bookings/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to update booking (${res.status})`);
      }
      setEditingId(null);
      setEditForm({});
      loadBookings();
    } catch (e: any) {
      alert(e.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete booking
  const deleteBooking = async (id: string) => {
    if (!confirm('Delete this booking?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to delete booking (${res.status})`);
      }
      loadBookings();
    } catch (e: any) {
      alert(e.message || 'Failed to delete booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark booking as completed
  const markAsCompleted = async (id: string) => {
    if (!confirm('Mark this booking as completed?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: 'completed' }) 
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to update booking (${res.status})`);
      }
      loadBookings();
    } catch (e: any) {
      alert(e.message || 'Failed to mark booking as completed');
    } finally {
      setActionLoading(null);
    }
  };

  // Removed deleteAllBookings per request

  // Add booking
  const addBooking = async () => {
    setActionLoading('add');
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        date: addForm.date,
        court: addForm.court,
        start: addForm.startTime,
        duration: addForm.duration,
        name: addForm.name,
        phone: addForm.phone,
      }) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Failed to create booking (${res.status})`);
      }
      
      // Show success message
      const startHours = parseInt(addForm.startTime.split(':')[0]);
      const isAfterMidnight = startHours >= 0 && startHours < 3;
      const message = isAfterMidnight 
        ? `Booking confirmed! ${addForm.name} is scheduled for ${addForm.court} on ${new Date(addForm.date).toLocaleDateString()} at ${addForm.startTime} (after midnight).`
        : `Booking confirmed! ${addForm.name} is scheduled for ${addForm.court} on ${new Date(addForm.date).toLocaleDateString()} at ${addForm.startTime}.`;
      
      alert(message);
      
      setShowAddForm(false);
      setAddForm({ court: 'Court A', date: '', startTime: '', duration: 60, name: '', phone: '' });
      loadBookings();
    } catch (e: any) {
      alert(e.message || 'Failed to create booking');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mt-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Admin Panel</h1>
          <p className="mt-1 text-slate-600">Manage all court bookings</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          <Plus className="h-4 w-4" /> Add Booking
        </button>
      </div>

      {/* Date selector with prev/next controls */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <h2 className="flex items-center text-sm font-semibold text-slate-900">
      <Calendar className="mr-2 h-4 w-4 text-primary" />
      Choose Date
    </h2>
    <button
      onClick={() => setShowAllBookings(!showAllBookings)}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
        showAllBookings 
          ? "bg-primary text-white" 
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {showAllBookings ? "Show by date" : "Show all bookings"}
    </button>
  </div>

  <div className="mt-4 overflow-x-auto">
    <div className="flex items-center gap-3 min-w-max pb-1">
      <button
        onClick={() => {
          const base = new Date(dateFilter);
          base.setDate(base.getDate() - 1);
          setDateFilter(base.toISOString().slice(0,10));
        }}
        className="rounded-full border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
        disabled={showAllBookings}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      {!showAllBookings && (
        <div className="flex items-center gap-3">
          {nextNDates().map((d) => {
            const active = d.iso === dateFilter;
            return (
              <button
                key={d.iso}
                onClick={() => setDateFilter(d.iso)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-white shadow-sm border border-primary"
                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
                aria-pressed={active}
              >
                {d.isToday ? "Today" : d.label}
              </button>
            );
          })}
        </div>
      )}
      
      <button
        onClick={() => {
          const base = new Date(dateFilter);
          base.setDate(base.getDate() + 1);
          setDateFilter(base.toISOString().slice(0,10));
        }}
        className="rounded-full border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
        disabled={showAllBookings}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
  {showAllBookings && (
    <div className="mt-3 text-sm text-slate-600">
      Showing all bookings across all dates
    </div>
  )}
</section>

      {/* Date indicator - between date and court sections */}
      {!showAllBookings && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-slate-700">
              Currently viewing: {new Date(dateFilter).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      )}

      {/* Export range modal */}
      {rangeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Export date range as PDF</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">From</label>
                <input type="date" value={rangeModal.from} onChange={(e)=>setRangeModal(v=>({...v,from:e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">To</label>
                <input type="date" value={rangeModal.to} onChange={(e)=>setRangeModal(v=>({...v,to:e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setRangeModal(v=>({...v,open:false}))} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm">Cancel</button>
              <button onClick={()=>{setRangeModal(v=>({...v,open:false})); exportToPdf(bookings,{rangeLabel:`${rangeModal.from} → ${rangeModal.to}`});}} className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white">Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Court filter (segmented) + actions (compact) */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Court segmented control */}
          <div className="w-full sm:w-auto">
            <div className="mb-2 text-sm font-medium text-slate-700 flex items-center gap-2">
              <Target className="h-4 w-4" /> Court
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
              {(["Court A", "Court B"] as const).map((label) => {
                const active = courtFilter === label;
                return (
                  <button
                    key={label}
                    onClick={() => setCourtFilter(label)}
                    className={`h-9 rounded-lg text-sm font-medium transition ${
                      active ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact actions menu */}
          <div className="relative sm:ml-auto">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
            >
              Actions
              <MoreVertical className="h-4 w-4 opacity-70" />
            </button>

            {actionsOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button onClick={() => { setActionsOpen(false); exportToPdf(bookings); }} className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2">
                  <FileDown className="h-4 w-4" /> Export as PDF
                </button>
                <button onClick={() => { setActionsOpen(false); setRangeModal({ open: true, from: dateFilter, to: dateFilter }); }} className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2">
                  <FileDown className="h-4 w-4" /> Export date range as PDF…
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bookings - mobile cards and desktop table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading bookings...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-slate-200">
              {bookings.map((booking) => (
                <div key={booking.id} className="p-4">
                  {editingId === booking.id ? (
                    <div className="space-y-4">
                                             {/* Court Selection */}
                       <div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Court <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1">
                            {(["Court A", "Court B"] as const).map((c) => {
                              const active = (editForm.court || booking.court) === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setEditForm({ ...editForm, court: c })}
                                  className={[
                                    "h-10 rounded-lg text-sm font-medium transition",
                                    active
                                      ? "bg-primary text-white shadow-sm"
                                      : "text-slate-600 hover:bg-white hover:shadow-sm"
                                  ].join(" ")}
                                  aria-pressed={active}
                                >
                                  {c}
                                </button>
                              );
                            })}
                          </div>
                                                 </div>
                       </div>

                      {/* Date & Time */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-2">
                            Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={editForm.start_at ? new Date(editForm.start_at).toISOString().slice(0, 10) : new Date(booking.start_at).toISOString().slice(0, 10)}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              const currentTime = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                              const newDateTime = new Date(newDate + 'T' + currentTime.toTimeString().slice(0, 6));
                              const endTime = editForm.end_at ? new Date(editForm.end_at) : new Date(booking.end_at);
                              const duration = endTime.getTime() - currentTime.getTime();
                              const newEndDateTime = new Date(newDateTime.getTime() + duration);
                              
                              setEditForm({
                                ...editForm,
                                start_at: newDateTime.toISOString(),
                                end_at: newEndDateTime.toISOString()
                              });
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={editForm.start_at ? new Date(editForm.start_at).toTimeString().slice(0, 5) : new Date(booking.start_at).toTimeString().slice(0, 5)}
                            onChange={(e) => {
                              const newTime = e.target.value;
                              const currentDate = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                              const [hours, minutes] = newTime.split(':').map(Number);
                              const newDateTime = new Date(currentDate);
                              newDateTime.setHours(hours, minutes, 0, 0);
                              
                              const endTime = editForm.end_at ? new Date(editForm.end_at) : new Date(booking.end_at);
                              const duration = endTime.getTime() - (editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at)).getTime();
                              const newEndDateTime = new Date(newDateTime.getTime() + duration);
                              
                              setEditForm({
                                ...editForm,
                                start_at: newDateTime.toISOString(),
                                end_at: newEndDateTime.toISOString()
                              });
                            }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            required
                          />
                          {/* After midnight warning */}
                          {(() => {
                            const startTime = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                            const hours = startTime.getHours();
                            if (hours >= 0 && hours < 3) {
                              return (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-xs text-amber-800">
                                    ⚠️ This is an after-midnight booking (next day).
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Duration <span className="text-red-500">*</span>
                          </label>
                          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-1">
                            {[60, 90, 120].map((d) => {
                              const currentStart = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                              const currentEnd = editForm.end_at ? new Date(editForm.end_at) : new Date(booking.end_at);
                              const currentDuration = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60);
                              const active = Math.abs(currentDuration - d) < 1; // Within 1 minute
                              
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    const newEndDateTime = new Date(currentStart.getTime() + (d * 60 * 1000));
                                    setEditForm({
                                      ...editForm,
                                      end_at: newEndDateTime.toISOString()
                                    });
                                  }}
                                  className={[
                                    "h-10 rounded-lg text-sm font-medium transition",
                                    active
                                      ? "bg-primary text-white shadow-sm"
                                      : "text-slate-600 hover:bg-white hover:shadow-sm"
                                  ].join(" ")}
                                  aria-pressed={active}
                                >
                                  {d === 60 ? "1h" : d === 90 ? "1h 30m" : "2h"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editForm.name ?? booking.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="Customer name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-900 mb-1">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={editForm.phone ?? booking.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                            placeholder="Phone number"
                            inputMode="tel"
                            required
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                          <Save className="h-4 w-4" /> Save
                        </button>
                        <button onClick={cancelEdit} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900">{booking.court}</div>
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          booking.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                          booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-slate-500">Date</div>
                          <div className="font-medium text-slate-800">{formatDate(booking.start_at)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Time</div>
                          <div className="font-medium text-slate-800">
                            {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                            {(() => {
                              const startHours = new Date(booking.start_at).getHours();
                              if (startHours >= 0 && startHours < 3) {
                                return (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    After midnight
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Name</div>
                          <div className="font-medium text-slate-800">{booking.name}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Phone</div>
                          <div className="font-medium text-slate-800">{booking.phone}</div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        {booking.status !== 'completed' && (
                          <button
                            onClick={() => markAsCompleted(booking.id)}
                            disabled={actionLoading === booking.id}
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3 w-3" /> Complete
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(booking)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                        <button
                          onClick={() => deleteBooking(booking.id)}
                          className="inline-flex items-center gap-1 rounded bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Court</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      {editingId === booking.id ? (
                        <>
                          <td className="px-4 py-3">
                            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-1">
                              {(["Court A", "Court B"] as const).map((c) => {
                                const active = (editForm.court || booking.court) === c;
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, court: c })}
                                    className={[
                                      "h-8 rounded-lg text-xs font-medium transition",
                                      active
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-slate-600 hover:bg-white hover:shadow-sm"
                                    ].join(" ")}
                                    aria-pressed={active}
                                  >
                                    {c}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="date"
                              value={editForm.start_at ? new Date(editForm.start_at).toISOString().slice(0, 10) : new Date(booking.start_at).toISOString().slice(0, 10)}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                const currentTime = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                                const newDateTime = new Date(newDate + 'T' + currentTime.toTimeString().slice(0, 6));
                                const endTime = editForm.end_at ? new Date(editForm.end_at) : new Date(booking.end_at);
                                const duration = endTime.getTime() - currentTime.getTime();
                                const newEndDateTime = new Date(newDateTime.getTime() + duration);
                                
                                setEditForm({
                                  ...editForm,
                                  start_at: newDateTime.toISOString(),
                                  end_at: newEndDateTime.toISOString()
                                });
                              }}
                              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <input
                                type="time"
                                value={editForm.start_at ? new Date(editForm.start_at).toTimeString().slice(0, 5) : new Date(booking.start_at).toTimeString().slice(0, 5)}
                                onChange={(e) => {
                                  const newTime = e.target.value;
                                  const currentDate = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                                  const [hours, minutes] = newTime.split(':').map(Number);
                                  const newDateTime = new Date(currentDate);
                                  newDateTime.setHours(hours, minutes, 0, 0);
                                  
                                  const endTime = editForm.end_at ? new Date(editForm.end_at) : new Date(booking.end_at);
                                  const duration = endTime.getTime() - (editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at)).getTime();
                                  const newEndDateTime = new Date(newDateTime.getTime() + duration);
                                  
                                  setEditForm({
                                    ...editForm,
                                    start_at: newDateTime.toISOString(),
                                    end_at: newEndDateTime.toISOString()
                                  });
                                }}
                                className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                              />
                              <div className="flex gap-1">
                                {[60, 90, 120].map((d) => {
                                  const currentStart = editForm.start_at ? new Date(editForm.start_at) : new Date(booking.start_at);
                                  const currentEnd = editForm.end_at ? new Date(editForm.end_at) : new Date(booking.end_at);
                                  const currentDuration = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60);
                                  const active = Math.abs(currentDuration - d) < 1;
                                  
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => {
                                        const newEndDateTime = new Date(currentStart.getTime() + (d * 60 * 1000));
                                        setEditForm({
                                          ...editForm,
                                          end_at: newEndDateTime.toISOString()
                                        });
                                      }}
                                      className={[
                                        "px-2 py-1 rounded text-xs font-medium transition",
                                        active
                                          ? "bg-primary text-white"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                      ].join(" ")}
                                      aria-pressed={active}
                                    >
                                      {d === 60 ? "1h" : d === 90 ? "1h30m" : "2h"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={editForm.name || ""}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="rounded border border-slate-200 px-2 py-1 text-sm w-full"
                              placeholder="Customer name"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="tel"
                              value={editForm.phone || ""}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="rounded border border-slate-200 px-2 py-1 text-sm w-full"
                              placeholder="Phone number"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={saveEdit}
                                className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded p-1 text-slate-600 hover:bg-slate-100"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-slate-800">{booking.court}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">{formatDate(booking.start_at)}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">
                            {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                            {(() => {
                              const startHours = new Date(booking.start_at).getHours();
                              if (startHours >= 0 && startHours < 3) {
                                return (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    After midnight
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-800">{booking.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-800">{booking.phone}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              booking.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                              booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                              "bg-slate-100 text-slate-800"
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {booking.status !== 'completed' && (
                                <button
                                  onClick={() => markAsCompleted(booking.id)}
                                  disabled={actionLoading === booking.id}
                                  className="rounded p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => startEdit(booking)}
                                className="rounded p-1 text-slate-600 hover:bg-slate-100"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => deleteBooking(booking.id)}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} bookings
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page <= 1}
                      className="rounded px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-slate-600">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.totalPages}
                      className="rounded px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Booking Modal */}
      {showAddForm && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Add new booking"
    onKeyDown={(e) => e.key === "Escape" && setShowAddForm(false)}
    onClick={(e) => {
      // close when clicking the dimmed backdrop
      if (e.target === e.currentTarget) setShowAddForm(false);
    }}
  >
    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-lg font-semibold text-slate-900">Add New Booking</h3>
        <span className="text-xs text-slate-500">All fields required</span>
      </div>

      {/* Body */}
      <div className="px-6 pb-4 pt-3 space-y-5">
        {/* Step 1: Court */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Court <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-1">
            {(["Court A", "Court B"] as const).map((c) => {
              const active = addForm.court === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAddForm({ ...addForm, court: c })}
                  className={[
                    "h-10 rounded-lg text-sm font-medium transition",
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:shadow-sm"
                  ].join(" ")}
                  aria-pressed={active}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

                 {/* Step 2: Date & Time */}
         <div className="space-y-3">
           <div className="flex items-center justify-between">
             <label className="block text-sm font-medium text-slate-900">
               Date &amp; Start time <span className="text-red-500">*</span>
             </label>
             <div className="flex items-center gap-2">
               <button
                 type="button"
                 className="rounded-md border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50"
                 onClick={() => {
                   const iso = new Date().toISOString().slice(0, 10);
                   setAddForm({ ...addForm, date: iso });
                 }}
                 title="Set to today"
               >
                 Today
               </button>
               <button
                 type="button"
                 className="rounded-md border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50"
                 onClick={() => {
                   // round now to next 30 minutes
                   const now = new Date();
                   const mins = now.getMinutes();
                   const rounded = mins % 30 === 0 ? mins : mins + (30 - (mins % 30));
                   now.setMinutes(rounded, 0, 0);
                   const hh = String(now.getHours()).padStart(2, "0");
                   const mm = String(now.getMinutes()).padStart(2, "0");
                   setAddForm({ ...addForm, startTime: `${hh}:${mm}` });
                 }}
                 title="Set time to next 30 minutes"
               >
                 Next 30m
               </button>
             </div>
           </div>

           {/* Date selection - match booking page style */}
           <div>
             <div className="overflow-x-auto">
               <div className="flex gap-3 min-w-max pb-1">
                 {nextNDates().map((d) => {
                   const active = d.iso === addForm.date;
                   return (
                     <button
                       key={d.iso}
                       type="button"
                       onClick={() => setAddForm({ ...addForm, date: d.iso })}
                       className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                         active
                           ? "bg-primary text-white shadow-sm border border-primary"
                           : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                       }`}
                       aria-pressed={active}
                     >
                       {d.isToday ? "Today" : d.label}
                     </button>
                   );
                 })}
               </div>
             </div>
           </div>

           {/* Custom time input */}
           <div>
             <label className="block text-sm font-medium text-slate-900 mb-1">
               Start Time <span className="text-red-500">*</span>
             </label>
             <input
               type="time"
               value={addForm.startTime}
               onChange={(e) => setAddForm({ ...addForm, startTime: e.target.value })}
               className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
               required
             />
             {/* After midnight warning */}
             {addForm.startTime && (() => {
               const [hours] = addForm.startTime.split(':').map(Number);
               if (hours >= 0 && hours < 3) {
                 return (
                   <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                     <p className="text-xs text-amber-800">
                       ⚠️ This is an after-midnight booking (next day). The booking will be scheduled for the day after the selected date.
                     </p>
                   </div>
                 );
               }
               return null;
             })()}
           </div>

          {/* Duration chips */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Duration <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-1">
              {[60, 90, 120].map((d) => {
                const active = addForm.duration === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, duration: d })}
                    className={[
                      "h-10 rounded-lg text-sm font-medium transition",
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:shadow-sm"
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    {d === 60 ? "1h" : d === 90 ? "1h 30m" : "2h"}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Opening hours: 10:00 AM – 2:00 AM (end time can extend to 4:00 AM).
            </p>
          </div>
        </div>

        {/* Step 3: Customer */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Customer name"
              autoFocus={(!addForm.name && !addForm.phone)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Phone number"
              inputMode="tel"
              required
            />
          </div>
        </div>
      </div>

      {/* Footer actions (sticky) */}
      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4 rounded-b-2xl">
        <button
          onClick={() => setShowAddForm(false)}
          className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-200"
        >
          Cancel
        </button>
        <button
          onClick={addBooking}
          disabled={!addForm.date || !addForm.startTime || !addForm.name || !addForm.phone}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Booking
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}



