import { useState, useEffect } from 'react';
import { FiTrendingUp, FiDollarSign, FiCalendar, FiBriefcase, FiGrid, FiPieChart } from 'react-icons/fi';
import api from '../../api';
import './AnalyticsView.css';

const AnalyticsView = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    revenue: 0
  });
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/stats'),
      api.get('/bookings'),
      api.get('/services')
    ]).then(([statsRes, bookingsRes, servicesRes]) => {
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
      setServices(servicesRes.data);
    })
    .catch(err => console.error('Error fetching analytics:', err))
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="page-loading"><div className="spinner" /></div>;
  }

  // Calculate some analytics:
  // 1. Popular packages
  const serviceCounts = {};
  bookings.forEach(b => {
    (b.services || []).forEach(s => {
      serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
    });
  });
  const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
  const popularService = sortedServices[0]?.[0] || 'Wedding Photography';

  // 2. Average booking value
  const avgValue = stats.total > 0 ? Math.floor(stats.revenue / (stats.confirmed || 1)) : 0;

  // 3. Simulated monthly trend data
  const monthlyData = [
    { month: 'Jan', bookings: 2, revenue: 50000 },
    { month: 'Feb', bookings: 4, revenue: 95000 },
    { month: 'Mar', bookings: 3, revenue: 70000 },
    { month: 'Apr', bookings: 6, revenue: 145000 },
    { month: 'May', bookings: 8, revenue: 210000 },
    { month: 'Jun', bookings: bookings.length + 5, revenue: stats.revenue + 60000 }
  ];

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    
    // Group bookings by date for daily works
    const dailyGroup = {};
    bookings.forEach(b => {
      const dateKey = new Date(b.date).toLocaleDateString();
      if (!dailyGroup[dateKey]) dailyGroup[dateKey] = [];
      dailyGroup[dateKey].push(b);
    });
    
    // Group monthly
    const monthlyGroup = {};
    bookings.forEach(b => {
      const monthKey = new Date(b.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!monthlyGroup[monthKey]) monthlyGroup[monthKey] = { count: 0, revenue: 0 };
      monthlyGroup[monthKey].count += 1;
      if (b.status === 'confirmed') {
        monthlyGroup[monthKey].revenue += (b.totalAmount || 0);
      }
    });

    // Group yearly
    const yearlyGroup = {};
    bookings.forEach(b => {
      const yearKey = new Date(b.date).getFullYear().toString();
      if (!yearlyGroup[yearKey]) yearlyGroup[yearKey] = { count: 0, revenue: 0 };
      yearlyGroup[yearKey].count += 1;
      if (b.status === 'confirmed') {
        yearlyGroup[yearKey].revenue += (b.totalAmount || 0);
      }
    });

    const dailyRows = Object.entries(dailyGroup).map(([date, list]) => `
      <tr>
        <td><strong>${date}</strong></td>
        <td>${list.map(b => `${b.customerName} (${(b.services || []).map(s => s.name).join(', ')})`).join('<br>')}</td>
        <td>${list.length} Shoot(s)</td>
        <td style="text-align: right;">₹${list.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const monthlyRows = Object.entries(monthlyGroup).map(([month, data]) => `
      <tr>
        <td><strong>${month}</strong></td>
        <td>${data.count} Shoot(s) booked</td>
        <td style="text-align: right; font-weight: 600;">₹${data.revenue.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const yearlyRows = Object.entries(yearlyGroup).map(([year, data]) => `
      <tr>
        <td><strong>Year ${year}</strong></td>
        <td>${data.count} Shoot(s) total</td>
        <td style="text-align: right; font-weight: 600;">₹${data.revenue.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Luminos Studio - Analytics Report</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
            .report-box { max-width: 900px; margin: auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #C9A84C; padding-bottom: 20px; margin-bottom: 20px; }
            .title { color: #C9A84C; font-size: 26px; font-weight: bold; }
            h3 { color: #333; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
            th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
            td { padding: 10px; border: 1px solid #ddd; font-size: 13px; vertical-align: top; }
            .kpi-row { display: flex; gap: 20px; margin-bottom: 20px; }
            .kpi-card { flex: 1; padding: 15px; background: #fafafa; border: 1px solid #eee; border-radius: 6px; }
            .kpi-num { font-size: 20px; font-weight: bold; color: #C9A84C; margin-top: 4px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #777; }
          </style>
        </head>
        <body>
          <div class="report-box">
            <div class="header">
              <div>
                <div class="title">Luminos Studio - Analytics Summary</div>
                <div>System Generated Business Intelligence Report</div>
              </div>
              <div style="text-align: right;">
                <div>Date: ${new Date().toLocaleDateString()}</div>
                <div>Status: Confirmed Figures Only</div>
              </div>
            </div>

            <div class="kpi-row">
              <div class="kpi-card">
                <div>Total Gross Revenue</div>
                <div class="kpi-num">₹${stats.revenue.toLocaleString('en-IN')}</div>
              </div>
              <div class="kpi-card">
                <div>Total Confirmed Bookings</div>
                <div class="kpi-num">${stats.confirmed}</div>
              </div>
              <div class="kpi-card">
                <div>Pending Bookings</div>
                <div class="kpi-num">${stats.pending}</div>
              </div>
            </div>

            <h3>📅 Daily Works & Schedule Ledger</h3>
            <table>
              <thead>
                <tr>
                  <th>Shoot Date</th>
                  <th>Client & Packages Details</th>
                  <th>Works Quantity</th>
                  <th style="text-align: right;">Estimated Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${dailyRows || '<tr><td colspan="4">No daily work entries recorded.</td></tr>'}
              </tbody>
            </table>

            <h3>📊 Monthly Performance Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Activity Volume</th>
                  <th style="text-align: right;">Confirmed Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${monthlyRows || '<tr><td colspan="3">No monthly statistics recorded.</td></tr>'}
              </tbody>
            </table>

            <h3>📈 Yearly Performance Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Annual Volume</th>
                  <th style="text-align: right;">Annual Confirmed Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${yearlyRows || '<tr><td colspan="3">No annual statistics recorded.</td></tr>'}
              </tbody>
            </table>

            <div class="footer">
              Luminos Studio &copy; ${new Date().getFullYear()}. Confidential internal report.
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="analytics-view">
      <div className="admin__page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="admin__page-title">Analytics & Insights</h2>
          <p className="text-silver">Studio performance metrics and business analysis</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrintReport}>
          🖨️ Export PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="analytics__grid">
        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim">
            <FiDollarSign size={20} />
          </div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Total Revenue</span>
            <h3 className="analytics__kpi-value text-gold">₹{stats.revenue.toLocaleString('en-IN')}</h3>
            <span className="analytics__kpi-sub">From {stats.confirmed} confirmed events</span>
          </div>
        </div>

        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim">
            <FiCalendar size={20} />
          </div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Total Bookings</span>
            <h3 className="analytics__kpi-value">{stats.total}</h3>
            <span className="analytics__kpi-sub">{stats.pending} pending confirmation</span>
          </div>
        </div>

        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim">
            <FiTrendingUp size={20} />
          </div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Avg. Booking Value</span>
            <h3 className="analytics__kpi-value">₹{avgValue.toLocaleString('en-IN')}</h3>
            <span className="analytics__kpi-sub">Per confirmed photoshoot</span>
          </div>
        </div>

        <div className="card analytics__kpi">
          <div className="analytics__kpi-icon text-gold bg-gold-dim">
            <FiBriefcase size={20} />
          </div>
          <div className="analytics__kpi-content">
            <span className="analytics__kpi-label">Popular Package</span>
            <h3 className="analytics__kpi-value" style={{ fontSize: '1.1rem', wordBreak: 'break-all', marginTop: '6px' }}>
              {popularService}
            </h3>
            <span className="analytics__kpi-sub">Most frequently booked service</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="analytics__charts-grid">
        {/* Monthly Booking Trend */}
        <div className="card analytics__chart-card">
          <h4 className="analytics__chart-title"><FiTrendingUp size={16} /> Monthly Bookings Trend</h4>
          <div className="analytics__chart-container">
            {/* Custom SVG line chart */}
            <svg viewBox="0 0 500 220" className="analytics__svg-chart">
              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" />
              <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.05)" />

              {/* Path line */}
              <path
                d="M 60 170 L 140 130 L 220 150 L 300 110 L 380 90 L 460 40"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Dots */}
              <circle cx="60" cy="170" r="5" fill="var(--charcoal-3)" stroke="var(--gold)" strokeWidth="3" />
              <circle cx="140" cy="130" r="5" fill="var(--charcoal-3)" stroke="var(--gold)" strokeWidth="3" />
              <circle cx="220" cy="150" r="5" fill="var(--charcoal-3)" stroke="var(--gold)" strokeWidth="3" />
              <circle cx="300" cy="110" r="5" fill="var(--charcoal-3)" stroke="var(--gold)" strokeWidth="3" />
              <circle cx="380" cy="90" r="5" fill="var(--charcoal-3)" stroke="var(--gold)" strokeWidth="3" />
              <circle cx="460" cy="40" r="5" fill="var(--charcoal-3)" stroke="var(--gold)" strokeWidth="3" />

              {/* X Axis Labels */}
              <text x="60" y="200" fill="var(--silver)" fontSize="10" textAnchor="middle">Jan</text>
              <text x="140" y="200" fill="var(--silver)" fontSize="10" textAnchor="middle">Feb</text>
              <text x="220" y="200" fill="var(--silver)" fontSize="10" textAnchor="middle">Mar</text>
              <text x="300" y="200" fill="var(--silver)" fontSize="10" textAnchor="middle">Apr</text>
              <text x="380" y="200" fill="var(--silver)" fontSize="10" textAnchor="middle">May</text>
              <text x="460" y="200" fill="var(--silver)" fontSize="10" textAnchor="middle">Jun</text>

              {/* Y Axis Labels */}
              <text x="30" y="173" fill="var(--silver)" fontSize="10" textAnchor="end">0</text>
              <text x="30" y="123" fill="var(--silver)" fontSize="10" textAnchor="end">5</text>
              <text x="30" y="73" fill="var(--silver)" fontSize="10" textAnchor="end">10</text>
              <text x="30" y="23" fill="var(--silver)" fontSize="10" textAnchor="end">15</text>
            </svg>
          </div>
        </div>

        {/* Revenue Share by category */}
        <div className="card analytics__chart-card">
          <h4 className="analytics__chart-title"><FiPieChart size={16} /> Booking Status Split</h4>
          <div className="analytics__chart-container flex-center">
            {/* Custom SVG Pie/Donut Chart */}
            <svg viewBox="0 0 200 200" width="160" height="160" className="analytics__svg-chart">
              {/* Confirmed - Green */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#52C07A" strokeWidth="25" strokeDasharray="300 440" strokeDashoffset="0" />
              {/* Pending - Gold */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#C9A84C" strokeWidth="25" strokeDasharray="100 440" strokeDashoffset="-300" />
              {/* Cancelled - Red */}
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="#E05252" strokeWidth="25" strokeDasharray="40 440" strokeDashoffset="-400" />
            </svg>
            <div className="analytics__legend">
              <div className="analytics__legend-item">
                <span className="analytics__legend-dot" style={{ background: '#52C07A' }} />
                <span>Confirmed ({stats.confirmed})</span>
              </div>
              <div className="analytics__legend-item">
                <span className="analytics__legend-dot" style={{ background: '#C9A84C' }} />
                <span>Pending ({stats.pending})</span>
              </div>
              <div className="analytics__legend-item">
                <span className="analytics__legend-dot" style={{ background: '#E05252' }} />
                <span>Cancelled ({stats.cancelled})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;