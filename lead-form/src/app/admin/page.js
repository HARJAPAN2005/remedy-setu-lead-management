'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './admin.module.css';
import TokenModal from '../components/TokenModal';

const API = process.env.NEXT_PUBLIC_API_URL;
const STATUS_OPTIONS = ['New', 'Contacted', 'Quoted', 'Won', 'Lost'];
const BUSINESS_TYPES = ['All', 'Astrologer', 'Retailer', 'Distributor', 'Other'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[`badge${status}`]}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={styles.statCard} style={{ '--stat-color': color }}>
      <span className={styles.statValue}>{value ?? '—'}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function LeadModal({ lead, token, onClose, onLeadUpdate }) {
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState('');

  async function saveNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    setNoteError('');
    try {
      const res = await fetch(`${API}/leads/${lead._id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: noteText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onLeadUpdate(updated);
        setNoteText('');
      } else {
        const d = await res.json().catch(() => ({}));
        setNoteError(d.message || 'Failed to save note.');
      }
    } catch {
      setNoteError('Network error. Please try again.');
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Lead Details</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.modalBody}>
          {/* Lead Info */}
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Name</span>
              <span className={styles.detailValue}>{lead.name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>
              <span className={styles.detailValue}>{lead.phone}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>City</span>
              <span className={styles.detailValue}>{lead.city}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Business Type</span>
              <span className={styles.detailValue}>{lead.businessType}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <span className={styles.detailValue}><StatusBadge status={lead.status} /></span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date</span>
              <span className={styles.detailValue}>{formatDate(lead.createdAt)}</span>
            </div>
            <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
              <span className={styles.detailLabel}>Products Interested</span>
              <span className={styles.detailValue}>
                {lead.productsInterested && lead.productsInterested.length > 0
                  ? lead.productsInterested.join(', ')
                  : '—'}
              </span>
            </div>
            {lead.message && (
              <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                <span className={styles.detailLabel}>Message</span>
                <span className={styles.detailValue}>{lead.message}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className={styles.notesSection}>
            <h3 className={styles.notesSectionTitle}>Notes</h3>
            {lead.notes && lead.notes.length > 0 ? (
              <ul className={styles.notesList}>
                {lead.notes.map((n, i) => (
                  <li key={i} className={styles.noteItem}>
                    <span className={styles.noteText}>{n.text}</span>
                    <span className={styles.noteTime}>{formatDate(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noNotes}>No notes yet.</p>
            )}

            <div className={styles.addNote}>
              <textarea
                className={styles.noteInput}
                rows={3}
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              {noteError && <p className={styles.noteError}>{noteError}</p>}
              <button
                className={styles.saveNoteBtn}
                onClick={saveNote}
                disabled={savingNote || !noteText.trim()}
              >
                {savingNote ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('All');
  const [filterBusiness, setFilterBusiness] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal
  const [selectedLead, setSelectedLead] = useState(null);

  // On mount: check localStorage for token
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (stored) {
      setToken(stored);
    } else {
      setShowTokenModal(true);
    }
  }, []);

  const fetchData = useCallback(
    async (tok) => {
      if (!tok) return;
      setLoading(true);
      setFetchError('');
      try {
        const [leadsRes, statsRes] = await Promise.all([
          fetch(`${API}/leads`, { headers: { Authorization: `Bearer ${tok}` } }),
          fetch(`${API}/leads/stats`, { headers: { Authorization: `Bearer ${tok}` } }),
        ]);
        if (leadsRes.status === 401 || statsRes.status === 401) {
          localStorage.removeItem('adminToken');
          setToken(null);
          setShowTokenModal(true);
          return;
        }
        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const [leadsData, statsData] = await Promise.all([leadsRes.json(), statsRes.json()]);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setStats(statsData);
      } catch (err) {
        setFetchError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (token) fetchData(token);
  }, [token, fetchData]);

  function handleTokenSubmit(tok) {
    localStorage.setItem('adminToken', tok);
    setToken(tok);
    setShowTokenModal(false);
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    setToken(null);
    setLeads([]);
    setStats(null);
    setShowTokenModal(true);
  }

  async function handleStatusChange(lead, newStatus) {
    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l._id === lead._id ? { ...l, status: newStatus } : l))
    );
    if (selectedLead && selectedLead._id === lead._id) {
      setSelectedLead((prev) => ({ ...prev, status: newStatus }));
    }
    try {
      await fetch(`${API}/leads/${lead._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // On failure revert
      setLeads((prev) =>
        prev.map((l) => (l._id === lead._id ? { ...l, status: lead.status } : l))
      );
    }
  }

  function handleLeadUpdate(updatedLead) {
    setLeads((prev) =>
      prev.map((l) => (l._id === updatedLead._id ? updatedLead : l))
    );
    setSelectedLead(updatedLead);
  }

  // Derived: unique cities
  const cities = ['All', ...Array.from(new Set(leads.map((l) => l.city).filter(Boolean))).sort()];

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    if (q && !l.name?.toLowerCase().includes(q) && !l.phone?.toLowerCase().includes(q)) return false;
    if (filterCity !== 'All' && l.city !== filterCity) return false;
    if (filterBusiness !== 'All' && l.businessType !== filterBusiness) return false;
    if (filterStatus !== 'All' && l.status !== filterStatus) return false;
    return true;
  });

  if (showTokenModal) {
    return <TokenModal onSubmit={handleTokenSubmit} apiUrl={API} />;
  }

  return (
    <div className={styles.dashboard}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarBrand}>
          <span className={styles.topBarMark}>✦</span>
          <span className={styles.topBarTitle}>Remedy Setu — Sales Dashboard</span>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className={styles.content}>
        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <StatCard label="Total Leads" value={stats.total} color="#8B4513" />
            <StatCard label="New" value={stats.new} color="#1565c0" />
            <StatCard label="Contacted" value={stats.contacted} color="#e65100" />
            <StatCard label="Quoted" value={stats.quoted} color="#6a1b9a" />
            <StatCard label="Won" value={stats.won} color="#2e7d32" />
            <StatCard label="Lost" value={stats.lost} color="#c62828" />
          </div>
        )}

        {/* Filters */}
        <div className={styles.filtersBar}>
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className={styles.filterSelect}
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Cities' : c}</option>
            ))}
          </select>
          <select
            value={filterBusiness}
            onChange={(e) => setFilterBusiness(e.target.value)}
            className={styles.filterSelect}
          >
            {BUSINESS_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt === 'All' ? 'All Business Types' : bt}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            {['All', ...STATUS_OPTIONS].map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
            ))}
          </select>
          <button className={styles.refreshBtn} onClick={() => fetchData(token)} title="Refresh">
            ↻ Refresh
          </button>
        </div>

        {/* Error */}
        {fetchError && (
          <div className={styles.fetchError}>{fetchError}</div>
        )}

        {/* Loading */}
        {loading && (
          <div className={styles.loadingBar}>
            <span className={styles.loadingSpinner} />
            Loading leads…
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className={styles.tableWrapper}>
            <div className={styles.tableCountRow}>
              Showing <strong>{filteredLeads.length}</strong> of <strong>{leads.length}</strong> leads
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Business Type</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyRow}>
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead._id} className={styles.tableRow}>
                      <td className={styles.nameCell}>{lead.name}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.city}</td>
                      <td>{lead.businessType}</td>
                      <td className={styles.productsCell}>
                        {lead.productsInterested && lead.productsInterested.length > 0
                          ? lead.productsInterested.join(', ')
                          : '—'}
                      </td>
                      <td>
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className={styles.dateCell}>{formatDate(lead.createdAt)}</td>
                      <td className={styles.actionsCell}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead, e.target.value)}
                          className={styles.statusSelect}
                          aria-label="Change status"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          className={styles.viewBtn}
                          onClick={() => setSelectedLead(lead)}
                        >
                          View / Notes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          token={token}
          onClose={() => setSelectedLead(null)}
          onLeadUpdate={handleLeadUpdate}
        />
      )}
    </div>
  );
}
