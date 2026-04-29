/**
 * PDF Report Generator — generates professional project progress reports
 * that can be downloaded and shared with clients.
 * Uses browser's print/PDF functionality via a hidden iframe with styled HTML.
 */

interface ReportData {
  projectName: string;
  projectStatus: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  generatedAt: string;
  workPackages: { subject: string; status: string; percentageDone: number; dueDate?: string }[];
  snags: { description: string; severity: string; status: string; location: string }[];
  changeOrders: { title: string; status: string; costImpact: number; reason: string }[];
  dailyReports: { reportDate: string; workCompleted: string; manpowerCount: number; weather?: string }[];
  metrics: {
    totalWPs: number; completedWPs: number; openSnags: number; criticalSnags: number;
    pendingCOs: number; totalCOValue: number;
  };
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
const fmtKES = (n: number) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

export function generateProjectReportHTML(data: ReportData): string {
  const snagsByStatus = data.snags.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const wpsComplete = data.workPackages.filter(w => ['Done', 'Closed'].includes(w.status)).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Project Progress Report — ${data.projectName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #fff; color: #111; font-size: 10pt; line-height: 1.5; }
    @page { margin: 20mm 15mm; size: A4; }

    .cover { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 40px; background: linear-gradient(135deg, #0a0a1a 0%, #0d1b3e 100%); page-break-after: always; }
    .cover-logo { font-size: 11pt; font-weight: 700; color: #60a5fa; letter-spacing: 0.2em; margin-bottom: 60px; }
    .cover-title { font-size: 28pt; font-weight: 800; color: #fff; margin-bottom: 12px; line-height: 1.2; }
    .cover-subtitle { font-size: 14pt; color: #94a3b8; margin-bottom: 40px; }
    .cover-meta { display: flex; gap: 40px; flex-wrap: wrap; }
    .cover-meta-item label { display: block; font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
    .cover-meta-item value { font-size: 12pt; font-weight: 600; color: #e2e8f0; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 9pt; font-weight: 700; letter-spacing: 0.05em; margin-top: 16px; background: #166534; color: #86efac; }

    .page { padding: 0; }
    h1 { font-size: 14pt; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 6px; margin: 24px 0 12px; }
    h2 { font-size: 11pt; font-weight: 600; color: #334155; margin: 16px 0 8px; }
    p { color: #475569; margin-bottom: 6px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
    .kpi-value { font-size: 20pt; font-weight: 700; color: #1e3a5f; }
    .kpi-label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
    .kpi-card.warn .kpi-value { color: #b45309; }
    .kpi-card.danger .kpi-value { color: #b91c1c; }
    .kpi-card.good .kpi-value { color: #166534; }

    .progress-bar-outer { background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden; margin: 4px 0; }
    .progress-bar-inner { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #2563eb, #3b82f6); }

    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
    th { background: #1e3a5f; color: #fff; font-weight: 600; padding: 8px 10px; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: 600; }
    .badge-open { background: #fee2e2; color: #991b1b; }
    .badge-progress { background: #dbeafe; color: #1e40af; }
    .badge-resolved { background: #dcfce7; color: #166534; }
    .badge-critical { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .badge-major { background: #fff7ed; color: #c2410c; }
    .badge-minor { background: #fefce8; color: #92400e; }
    .badge-approved { background: #dcfce7; color: #166534; }
    .badge-draft { background: #f1f5f9; color: #64748b; }
    .badge-submitted { background: #fef9c3; color: #92400e; }

    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; }

    .section-intro { background: #f0f9ff; border-left: 3px solid #0284c7; padding: 10px 14px; border-radius: 4px; margin: 8px 0 16px; font-size: 9pt; color: #0369a1; }
  </style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-logo">PROTECHT BIM · CONSTRUCTION INTELLIGENCE</div>
  <div class="cover-title">${data.projectName}</div>
  <div class="cover-subtitle">Project Progress Report</div>
  <div class="cover-meta">
    <div class="cover-meta-item"><label>Report Date</label><value>${data.generatedAt}</value></div>
    <div class="cover-meta-item"><label>Start Date</label><value>${fmtDate(data.startDate)}</value></div>
    <div class="cover-meta-item"><label>Target Completion</label><value>${fmtDate(data.endDate)}</value></div>
    <div class="cover-meta-item"><label>Overall Progress</label><value>${data.progress}%</value></div>
  </div>
  <div class="status-badge">${data.projectStatus.toUpperCase()}</div>
</div>

<!-- EXECUTIVE SUMMARY -->
<div class="page">
  <h1>1. Executive Summary</h1>
  <div class="kpi-grid">
    <div class="kpi-card ${data.progress >= 70 ? 'good' : data.progress >= 40 ? '' : 'warn'}">
      <div class="kpi-value">${data.progress}%</div>
      <div class="kpi-label">Overall Progress</div>
      <div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${data.progress}%"></div></div>
    </div>
    <div class="kpi-card ${wpsComplete === data.metrics.totalWPs ? 'good' : ''}">
      <div class="kpi-value">${wpsComplete}/${data.metrics.totalWPs}</div>
      <div class="kpi-label">Work Packages Complete</div>
    </div>
    <div class="kpi-card ${data.metrics.openSnags > 0 ? 'warn' : 'good'}">
      <div class="kpi-value">${data.metrics.openSnags}</div>
      <div class="kpi-label">Open Snags</div>
    </div>
    <div class="kpi-card ${data.metrics.criticalSnags > 0 ? 'danger' : 'good'}">
      <div class="kpi-value">${data.metrics.criticalSnags}</div>
      <div class="kpi-label">Critical Defects</div>
    </div>
    <div class="kpi-card ${data.metrics.pendingCOs > 0 ? 'warn' : ''}">
      <div class="kpi-value">${data.metrics.pendingCOs}</div>
      <div class="kpi-label">Pending Change Orders</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${fmtKES(data.metrics.totalCOValue)}</div>
      <div class="kpi-label">Variation Value</div>
    </div>
  </div>

  <!-- WORK PACKAGES -->
  <h1>2. Work Packages</h1>
  <div class="section-intro">
    ${data.workPackages.length} packages tracked. ${wpsComplete} completed, ${data.workPackages.filter(w => ['In Progress', 'New'].includes(w.status)).length} active.
  </div>
  <table>
    <thead><tr><th>Work Package</th><th>Status</th><th>Progress</th><th>Due Date</th></tr></thead>
    <tbody>
      ${data.workPackages.slice(0, 20).map(w => `
        <tr>
          <td>${w.subject}</td>
          <td><span class="badge ${w.status === 'Closed' || w.status === 'Done' ? 'badge-approved' : w.status === 'In Progress' ? 'badge-progress' : 'badge-draft'}">${w.status}</span></td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div class="progress-bar-outer" style="flex:1;"><div class="progress-bar-inner" style="width:${w.percentageDone || 0}%"></div></div>
              <span style="font-size:8pt;color:#64748b;white-space:nowrap;">${w.percentageDone || 0}%</span>
            </div>
          </td>
          <td>${fmtDate(w.dueDate)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <!-- SNAGS -->
  <h1>3. Snag &amp; Defect Register</h1>
  <div class="section-intro">
    ${data.snags.length} snags recorded. ${snagsByStatus['Open'] || 0} open, ${snagsByStatus['In Progress'] || 0} in progress, ${snagsByStatus['Resolved'] || 0} resolved.
  </div>
  ${data.snags.length === 0 ? '<p>No snags recorded for this period.</p>' : `
  <table>
    <thead><tr><th>Description</th><th>Location</th><th>Severity</th><th>Status</th></tr></thead>
    <tbody>
      ${data.snags.slice(0, 15).map(s => `
        <tr>
          <td>${s.description}</td>
          <td>${s.location}</td>
          <td><span class="badge ${s.severity === 'Critical' ? 'badge-critical' : s.severity === 'Major' ? 'badge-major' : 'badge-minor'}">${s.severity}</span></td>
          <td><span class="badge ${s.status === 'Open' ? 'badge-open' : s.status === 'In Progress' ? 'badge-progress' : 'badge-resolved'}">${s.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}

  <!-- CHANGE ORDERS -->
  <h1>4. Change Orders</h1>
  ${data.changeOrders.length === 0 ? '<p>No change orders issued for this project.</p>' : `
  <table>
    <thead><tr><th>Title</th><th>Reason</th><th>Status</th><th>Cost Impact</th></tr></thead>
    <tbody>
      ${data.changeOrders.slice(0, 10).map(c => `
        <tr>
          <td>${c.title}</td>
          <td>${c.reason}</td>
          <td><span class="badge ${c.status === 'Approved' ? 'badge-approved' : c.status === 'Draft' ? 'badge-draft' : 'badge-submitted'}">${c.status}</span></td>
          <td style="white-space:nowrap;">${Number(c.costImpact) >= 0 ? '+' : ''}${fmtKES(c.costImpact)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}

  <!-- RECENT DAILY REPORTS -->
  <h1>5. Recent Site Activity</h1>
  ${data.dailyReports.length === 0 ? '<p>No daily reports submitted.</p>' : `
  <table>
    <thead><tr><th>Date</th><th>Work Completed</th><th>Manpower</th><th>Weather</th></tr></thead>
    <tbody>
      ${data.dailyReports.slice(0, 8).map(r => `
        <tr>
          <td style="white-space:nowrap;">${fmtDate(r.reportDate)}</td>
          <td>${(r.workCompleted || '').substring(0, 120)}${(r.workCompleted || '').length > 120 ? '…' : ''}</td>
          <td>${r.manpowerCount || 0}</td>
          <td>${r.weather || '—'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}

  <div class="footer">
    <span>PROTECHT BIM — Construction Intelligence Platform</span>
    <span>Generated: ${data.generatedAt} · Confidential</span>
  </div>
</div>
</body>
</html>`;
}

export function downloadProjectReport(data: ReportData): void {
  const html = generateProjectReportHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.projectName.replace(/[^a-z0-9]/gi, '_')}_Progress_Report_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printProjectReport(data: ReportData): void {
  const html = generateProjectReportHTML(data);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
