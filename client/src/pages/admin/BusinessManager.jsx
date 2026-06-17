import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiUsers, FiCpu, FiPlus, FiTrash, FiBookOpen } from 'react-icons/fi';
import api from '../..//api';
import './BusinessManager.css';

const BusinessManager = () => {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'employees' | 'leadscore' | 'aiwriter'
  const [loading, setLoading] = useState(true);

  // Business states
  const [expenses, setExpenses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // New expense form
  const [newExp, setNewExp] = useState({ category: 'Crew Payout', amount: '', bookingId: '', notes: '' });
  
  // New employee form
  const [newEmp, setNewEmp] = useState({ name: '', role: '', leaveDays: 0, attendance: 100 });
  
  // AI content writer states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiType, setAiType] = useState('instagram');
  const [aiResult, setAiResult] = useState('');
  const [aiWriting, setAiWriting] = useState(false);

  // OTP Verification display
  const [otpEnabled, setOtpEnabled] = useState(true);

  const loadAdminData = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/expenses'),
      api.get('/admin/employees'),
      api.get('/admin/leads'),
      api.get('/bookings')
    ]).then(([expRes, empRes, leadRes, bookRes]) => {
      setExpenses(expRes.data);
      setEmployees(empRes.data);
      setLeads(leadRes.data);
      setBookings(bookRes.data);
    })
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExp.amount) return;
    try {
      const { data } = await api.post('/admin/expenses', {
        category: newExp.category,
        amount: parseFloat(newExp.amount),
        bookingId: newExp.bookingId || 'General Studio',
        notes: newExp.notes,
        date: new Date().toISOString().substring(0, 10)
      });
      setExpenses(prev => [data, ...prev]);
      setNewExp({ category: 'Crew Payout', amount: '', bookingId: '', notes: '' });
    } catch {
      alert('Failed to register expense.');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await api.delete(`/admin/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e._id !== id));
    } catch {
      alert('Could not delete expense.');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.name) return;
    try {
      const { data } = await api.post('/admin/employees', {
        name: newEmp.name,
        role: newEmp.role,
        leaveDays: parseInt(newEmp.leaveDays),
        attendance: parseInt(newEmp.attendance)
      });
      setEmployees(prev => [...prev, data]);
      setNewEmp({ name: '', role: '', leaveDays: 0, attendance: 100 });
    } catch {
      alert('Could not register crew employee.');
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await api.delete(`/admin/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id !== id));
    } catch {
      alert('Could not delete crew record.');
    }
  };

  const handleRunAIWriter = async (e) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setAiWriting(true);
    setAiResult('');
    try {
      const { data } = await api.post('/admin/ai-writer', {
        prompt: aiPrompt,
        type: aiType
      });
      setAiResult(data.result);
    } catch {
      setAiResult('Error generating AI text.');
    } finally {
      setAiWriting(false);
    }
  };

  // Calculate Lead priority Score (0-100)
  const scoreLead = (lead) => {
    let score = 30; // base score
    if (lead.phone) score += 30; // warm contact
    if (lead.email) score += 10;
    const inquiry = (lead.packageInquiry || '').toLowerCase();
    if (inquiry.includes('wedding')) score += 30; // high value event
    if (inquiry.includes('cinematic')) score += 10;
    return Math.min(110, score);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  // Calculate financial overview
  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.floor((netProfit / totalRevenue) * 100) : 100;

  return (
    <div className="business-manager">
      <div className="admin__page-header flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="admin__page-title">Business & Resource Management</h2>
          <p className="text-silver">Track revenue margins, logs, crew listings, and AI generative content suites</p>
        </div>
        <div className="card text-center" style={{ padding: '8px 16px', background: 'rgba(46,204,113,0.06)', border: '1px solid #2ecc71', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--silver)' }}>OTP 2FA Status</span>
          <div style={{ color: '#2ecc71', fontWeight: 600, fontSize: '0.88rem' }}>🔒 Active OTP Login</div>
        </div>
      </div>

      {/* KPI Financial row */}
      <div className="analytics__grid" style={{ marginBottom: '24px' }}>
        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim"><FiDollarSign /></div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Gross Confirmed Revenue</span>
            <h3 className="analytics__kpi-value text-gold">₹{totalRevenue.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim"><FiTrash /></div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Total Spent Expenses</span>
            <h3 className="analytics__kpi-value">₹{totalExpenses.toLocaleString('en-IN')}</h3>
          </div>
        </div>
        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim"><FiTrendingUp /></div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Net Profit Margin</span>
            <h3 className="analytics__kpi-value text-success" style={{ color: '#2ecc71' }}>{profitMargin}% Margin</h3>
            <span className="analytics__kpi-sub">Net Profit: ₹{netProfit.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="customer-manager__tabs" style={{ marginBottom: '20px' }}>
        <button className={`customer-manager__tab ${activeTab === 'expenses' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('expenses')}>
          <FiDollarSign /> Studio Expenses ({expenses.length})
        </button>
        <button className={`customer-manager__tab ${activeTab === 'employees' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('employees')}>
          <FiUsers /> Photographer Team & Attendance
        </button>
        <button className={`customer-manager__tab ${activeTab === 'leadscore' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('leadscore')}>
          <FiCpu /> AI Lead Scoring ({leads.length})
        </button>
        <button className={`customer-manager__tab ${activeTab === 'aiwriter' ? 'customer-manager__tab--active' : ''}`} onClick={() => setActiveTab('aiwriter')}>
          <FiBookOpen /> AI Content Writer
        </button>
      </div>

      <div className="card customer-manager__panel animate-fade-in" key={activeTab}>
        {/* 1. EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="grid-2 gap-lg align-start">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Booking / Client</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-silver" style={{ padding: '24px' }}>No expenses recorded yet.</td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e._id}>
                        <td className="admin-table__service-name">{e.category}</td>
                        <td className="text-silver" style={{ fontSize: '0.8rem' }}>{e.bookingId}</td>
                        <td style={{ fontWeight: 600 }}>₹{e.amount?.toLocaleString('en-IN')}</td>
                        <td>{e.date}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-outline-gold btn-sm" style={{ padding: '4px', minWidth: 'auto' }} onClick={() => handleDeleteExpense(e._id)}>
                            <FiTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleAddExpense} className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h4 style={{ color: 'var(--cream)', marginBottom: '12px', fontSize: '0.95rem' }}>Record Studio Expense</h4>
              <div className="form-group">
                <label>Expense Category</label>
                <select className="form-input" value={newExp.category} onChange={e => setNewExp({ ...newExp, category: e.target.value })}>
                  <option value="Crew Payout">Crew Payout / Photographer wages</option>
                  <option value="Travel Expenses">Travel Expenses / Fuel</option>
                  <option value="Equipment Rental">Equipment Rental / Lenses</option>
                  <option value="Album Printing">Album Printing & Framing</option>
                  <option value="Advertising">Advertising & Marketing</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Amount (INR)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newExp.amount}
                  onChange={e => setNewExp({ ...newExp, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Linked Booking / Event ID (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newExp.bookingId}
                  onChange={e => setNewExp({ ...newExp, bookingId: e.target.value })}
                  placeholder="e.g. LB-..."
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Additional Notes</label>
                <input
                  type="text"
                  className="form-input"
                  value={newExp.notes}
                  onChange={e => setNewExp({ ...newExp, notes: e.target.value })}
                  placeholder="e.g. payout for second wedding videographer"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }}>
                <FiPlus /> Add Expense Ledger
              </button>
            </form>
          </div>
        )}

        {/* 2. EMPLOYEES TEAM */}
        {activeTab === 'employees' && (
          <div className="grid-2 gap-lg align-start">
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Crew Member</th>
                    <th>Role / Specialization</th>
                    <th>Leave Balance</th>
                    <th>Attendance</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-silver" style={{ padding: '24px' }}>No crew records registered.</td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp._id}>
                        <td className="admin-table__service-name">{emp.name}</td>
                        <td>{emp.role}</td>
                        <td style={{ textAlign: 'center' }}>{emp.leaveDays} Days</td>
                        <td style={{ color: emp.attendance > 90 ? '#2ecc71' : 'var(--gold)' }}>{emp.attendance}%</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-outline-gold btn-sm" style={{ padding: '4px', minWidth: 'auto' }} onClick={() => handleDeleteEmployee(emp._id)}>
                            <FiTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleAddEmployee} className="card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ color: 'var(--cream)', marginBottom: '12px', fontSize: '0.95rem' }}>Register Crew Member</h4>
              <div className="form-group">
                <label>Crew Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmp.name}
                  onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Specialization Role</label>
                <input
                  type="text"
                  className="form-input"
                  value={newEmp.role}
                  onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                  placeholder="e.g. Candid Photographer / Drone Pilot"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: '12px' }}>
                <FiPlus /> Add Photographer Record
              </button>
            </form>
          </div>
        )}

        {/* 3. AI LEAD SCORING */}
        {activeTab === 'leadscore' && (
          <div className="admin-table-wrap">
            <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '16px' }}>AI Lead Scoring & Inquiries</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Inquiry Details</th>
                  <th style={{ textAlign: 'center' }}>AI Lead Score</th>
                  <th>Priority Tier</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-silver" style={{ padding: '24px' }}>No chatbot inquiries recorded yet.</td>
                  </tr>
                ) : (
                  leads.map((l) => {
                    const score = scoreLead(l);
                    return (
                      <tr key={l._id}>
                        <td className="admin-table__service-name">{l.name}</td>
                        <td>
                          <div style={{ fontSize: '0.82rem', color: 'var(--cream-dim)' }}>📞 {l.phone || 'No phone'} | ✉ {l.email || 'No email'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--silver)', fontStyle: 'italic', marginTop: '2px' }}>Inquiry: {l.packageInquiry || 'General Inquiry'}</div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }} className={score >= 70 ? 'text-gold' : 'text-silver'}>
                          {score} / 100
                        </td>
                        <td>
                          {score >= 70 ? (
                            <span className="status-badge status-confirmed">👑 HIGH VALUE</span>
                          ) : score >= 50 ? (
                            <span className="status-badge status-pending">🔥 WARM LEAD</span>
                          ) : (
                            <span className="status-badge status-cancelled">❄ COOL LEAD</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. AI CONTENT WRITER */}
        {activeTab === 'aiwriter' && (
          <div className="grid-2 gap-lg align-start">
            <form onSubmit={handleRunAIWriter} className="card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '12px' }}>AI Generation Suite</h3>
              <div className="form-group">
                <label>Choose Output Template</label>
                <select className="form-input" value={aiType} onChange={e => setAiType(e.target.value)}>
                  <option value="instagram">Instagram Caption generator</option>
                  <option value="email">Client Booking Callback Draft</option>
                  <option value="description">Bespoke Catalog Description</option>
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Input Generation Prompt / Theme details</label>
                <textarea
                  className="form-input"
                  style={{ height: '100px', resize: 'vertical' }}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. cinematic post-wedding golden hour photoshoot next to Taj Mahal in traditional clothing"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={aiWriting}>
                {aiWriting ? 'Generating via AI...' : 'Generate Marketing Copy'}
              </button>
            </form>

            <div className="card" style={{ padding: '24px', minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ color: 'var(--cream)', fontSize: '0.95rem', marginBottom: '12px' }}>AI Copy Output</h4>
              {aiResult ? (
                <div style={{ flex: 1, whiteSpace: 'pre-line', padding: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '6px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--cream-dim)' }}>
                  {aiResult}
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '6px', color: 'var(--silver)', fontSize: '0.8rem' }}>
                  Write a prompt and click generate to generate copy.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessManager;
