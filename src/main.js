import { createIcons, LayoutDashboard, Users, CalendarCheck, ChartNoAxesCombined, FileChartColumn, Settings, CircleHelp, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ArrowUpRight, ArrowDownRight, Plus, Download, CalendarDays, GraduationCap, PanelLeftClose, X, Check, MoreHorizontal, SlidersHorizontal, ArrowRight, Clock3, CircleCheck, TriangleAlert, ClipboardList, Mail, LogOut, BookOpen, Menu, Upload, Save, FileText, ExternalLink } from 'lucide';
import { classes, today, loadState, mergeState, status, average } from './data.js';
import './style.css';
const iconSet = { LayoutDashboard, Users, CalendarCheck, ChartNoAxesCombined, FileChartColumn, Settings, CircleHelp, Search, Bell, ChevronDown, ChevronRight, ChevronLeft, ArrowUpRight, ArrowDownRight, Plus, Download, CalendarDays, GraduationCap, PanelLeftClose, X, Check, MoreHorizontal, SlidersHorizontal, ArrowRight, Clock3, CircleCheck, TriangleAlert, ClipboardList, Mail, LogOut, BookOpen, Menu, Upload, Save, FileText, ExternalLink };
const icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}"></i>`;
const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let state = loadState();
let savedSnapshot = structuredClone(state);
let page = 'Overview';
let search = '';
let classFilter = 'All classes';
let statusFilter = 'All statuses';
let pageNumber = 1;
let chartPeriod = 'This week';
let attendanceDate = today();
let attendanceDraft = {};
let dirtyAttendance = false;
let toastTimer;
const app = document.querySelector('#app');
const initials = s => s.name.split(' ').map(n => n[0]).slice(0, 2).join('');
const avatar = (s, extra = '') => `<span class="avatar ${esc(s.color || 'purple')} ${extra}">${esc(initials(s))}</span>`;
const pill = s => `<span class="status ${status(s).toLowerCase().replace(' ', '-')}"><span></span>${status(s)}</span>`;
function icons() { createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.75 } }); }
async function persist(update = () => true) {
  try {
    const write = () => {
      const next = mergeState(savedSnapshot, state, loadState());
      if (update(next) === false) return 'invalid';
      state = next;
      localStorage.setItem('campus-monitor-v1', JSON.stringify(state));
      savedSnapshot = structuredClone(state);
      return true;
    };
    // Older browsers retain local saving; supporting browsers serialize tabs.
    return navigator.locks?.request
      ? await navigator.locks.request('campus-monitor-v1', write)
      : write();
  }
  catch { toast('Browser storage is full or unavailable. Changes will last for this session.'); return false; }
}
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3600); }
function activity(title, detail, type = 'student') { state.activities.unshift({ title, detail, type, time: Date.now() }); state.activities = state.activities.slice(0, 30); }
const navItems = [['Overview', 'layout-dashboard'], ['Students', 'users'], ['Attendance', 'calendar-check'], ['Performance', 'chart-no-axes-combined'], ['Reports', 'file-chart-column']];
function shell() {
  app.innerHTML = `<aside class="sidebar">
    <a class="brand" href="#overview" aria-label="Campus overview"><span class="brand-mark">${icon('graduation-cap')}</span><span>campus<span class="brand-dot">.</span></span></a>
    <div class="workspace"><span class="school-logo">W</span><div><strong>${esc(state.school)}</strong><span>Student workspace</span></div>${icon('chevron-down')}</div>
    <div class="nav-label">WORKSPACE</div>
    <nav>${navItems.map(([name, ico]) => `<a href="#${name.toLowerCase()}" class="nav-link ${page === name ? 'active' : ''}">${icon(ico)}<span>${name}</span>${name === 'Students' ? `<span class="nav-count">${state.students.length}</span>` : ''}</a>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="support-card"><span class="support-icon">${icon('book-open')}</span><h4>A little help goes a long way.</h4><p>Everything you need to make<br>the most of Campus.</p><button class="support-link" data-action="help">Explore help center ${icon('arrow-up-right')}</button></div>
    <a href="#settings" class="nav-link ${page === 'Settings' ? 'active' : ''}">${icon('settings')}<span>Settings</span></a><button class="nav-link" data-action="help">${icon('circle-help')}<span>Help & support</span></button>
    <button class="profile" data-action="profile"><span class="profile-avatar">JD</span><span><strong>Jessica Davis</strong><small>Administrator</small></span>${icon('chevron-down')}</button></div>
  </aside>
  <div class="main-shell"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" aria-label="Open navigation" data-action="menu">${icon('menu')}</button><span>Workspace</span>${icon('chevron-right')}<strong>${page}</strong></div><div class="topbar-actions"><button class="global-search" data-action="search">${icon('search')}<span>Search anything...</span><kbd>⌘ K</kbd></button><span class="topbar-divider"></span><button class="notification icon-button" data-action="notifications" aria-label="Notifications">${icon('bell')}<span></span></button><button class="mini-profile" data-action="profile" aria-label="Your profile">JD</button></div></header>
  <main id="main-content"></main><footer><span>Thoughtfully connected. Better together.</span><span><span class="live-dot"></span> All systems operational</span></footer></div>`;
  renderContent();
}
function heading(title, subtitle, actions = '') { return `<div class="page-heading"><div><div class="eyebrow">YOUR CAMPUS, AT A GLANCE</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`; }
const addButton = `<button class="button primary" data-action="add-student">${icon('plus')} Add student</button>`;
function filteredStudents() { return state.students.filter(s => (classFilter === 'All classes' || s.className === classFilter) && (statusFilter === 'All statuses' || status(s) === statusFilter) && `${s.name} ${esc(s.id)} ${s.email}`.toLowerCase().includes(search.toLowerCase())); }
function metrics() {
  const risk = state.students.filter(s => status(s) === 'At risk').length;
  return `<div class="metrics">
    ${metric('Total students', state.students.length.toLocaleString(), 'users', 'purple', 'Across 6 classes', 'Enrolled students')}
    ${metric('Average attendance', `${average(state.students, 'attendance')}<span>%</span>`, 'calendar-check', 'green', 'Keeping students connected', 'Attendance rate')}
    ${metric('Academic performance', `${average(state.students, 'score')}<span>%</span>`, 'chart-no-axes-combined', 'blue', 'A little progress, every day', 'Average score')}
    ${metric('Students at risk', risk, 'triangle-alert', 'orange', 'Let’s give them a little support', 'Need your attention')}
  </div>`;
}
function metric(label, value, ico, color, caption, detail) { return `<div class="metric-card"><div class="metric-top"><span>${label}</span><span class="metric-icon ${color}">${icon(ico)}</span></div><div class="metric-value">${value}<span class="metric-detail">${detail}</span></div><div class="metric-caption">${color === 'orange' ? '<span class="orange-dot"></span>' : icon('arrow-up-right')} ${caption}</div></div>`; }
function trendChart() {
  const weekly = chartPeriod === 'This week';
  const labels = weekly ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  const values = weekly ? [91, 95, 93, 97, 94] : [89, 92, 95, 93, 96];
  return `<section class="panel attendance-panel"><div class="panel-heading"><div><h2>Attendance overview <span class="subtle-tag">Sample trend</span></h2><p>Showing up is the first step to success.</p></div><select id="chart-period" class="small-select" aria-label="Attendance chart period"><option ${weekly ? 'selected' : ''}>This week</option><option ${!weekly ? 'selected' : ''}>This month</option></select></div>
  <div class="chart-legend"><span><i class="legend-dot purple-dot"></i>Present</span><span><i class="legend-dot pale-dot"></i>Absent</span><span class="chart-summary"><strong>${weekly ? '94.0' : '93.0'}%</strong> avg. attendance</span></div>
  <div class="bar-chart"><div class="y-axis"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div class="plot"><div class="grid-lines"><i></i><i></i><i></i><i></i><i></i></div><div class="bar-groups">${values.map((v, i) => `<div class="bar-group"><div class="bar-stack" tabindex="0" aria-label="${labels[i]}: ${v}% present, ${100 - v}% absent"><div class="bar-absent" style="height:${100 - v}%"></div><div class="bar-present" style="height:${v}%"></div><span class="chart-tooltip">${v}% present</span></div><span class="x-label">${labels[i]}</span></div>`).join('')}</div></div></div>
  <div class="chart-note">${icon('circle-check')} Every day in class makes a difference.</div></section>`;
}
function performanceChart() {
  const total = state.students.length || 1;
  const excellent = state.students.filter(s => status(s) === 'Excellent').length;
  const track = state.students.filter(s => status(s) === 'On track').length;
  const risk = state.students.length - excellent - track;
  const e = excellent / total * 100, t = track / total * 100;
  return `<section class="panel performance-panel"><div class="panel-heading"><div><h2>Student performance</h2><p>A snapshot of academic progress.</p></div><button class="icon-button" data-action="performance" aria-label="View performance details">${icon('arrow-up-right')}</button></div><div class="donut-wrap"><div class="donut" style="background:conic-gradient(#8671d8 0% ${e}%, #c4b7ee ${e}% ${e + t}%, #f3bd93 ${e + t}% 100%)"><div class="donut-hole"><span>Average score</span><strong>${average(state.students, 'score')}<small>%</small></strong><span class="donut-caption">A campus full of potential</span></div></div></div><div class="performance-legend">${[['Excellent', excellent, 'purple-dot', '90% and above'], ['On track', track, 'lavender-dot', 'Making steady progress'], ['At risk', risk, 'orange-dot', 'Needs a helping hand']].map(([label, n, color, tip]) => `<button data-status="${label}" title="${tip}"><span><i class="legend-dot ${color}"></i>${label}</span><strong>${n}<small>${Math.round(n / total * 100)}%</small></strong></button>`).join('')}</div></section>`;
}
function recentActivity() {
  const defaults = [{ title: 'Attendance is ready to record', detail: 'Start your daily classroom check-in', type: 'attendance', time: 0 }, { title: 'Academic overview is up to date', detail: '128 sample student profiles are ready', type: 'report', time: 0 }, { title: 'Welcome to your workspace', detail: 'Good things start with a little connection', type: 'student', time: 0 }];
  const activities = [...state.activities, ...defaults].slice(0, 3);
  return `<section class="panel activity-panel"><div class="panel-heading"><h2>Recent activity</h2><button class="text-button" data-action="all-activity">View all ${icon('arrow-right')}</button></div><div class="activity-list">${activities.map(a => `<div class="activity-item"><span class="activity-icon ${a.type === 'attendance' ? 'green' : a.type === 'report' ? 'blue' : 'purple'}">${icon(a.type === 'attendance' ? 'calendar-check' : a.type === 'report' ? 'file-chart-column' : 'users')}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p><small>${a.time ? relativeTime(a.time) : 'Getting started'}</small></div></div>`).join('')}</div><div class="activity-footer"><span class="live-dot"></span> You’re all caught up.</div></section>`;
}
function relativeTime(time) { const minutes = Math.floor((Date.now() - time) / 60000); return minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes} min ago` : new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function studentTable(limit = 6) {
  const list = filteredStudents();
  const pages = Math.max(1, Math.ceil(list.length / limit));
  pageNumber = Math.min(pageNumber, pages);
  const rows = list.slice((pageNumber - 1) * limit, pageNumber * limit);
  return `<div class="table-scroll"><table><thead><tr><th><input type="checkbox" id="select-all" aria-label="Select all students on this page"></th><th>Student name</th><th>Class</th><th>Attendance ${icon('chevron-down')}</th><th>Avg. score</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(s => `<tr><td><input type="checkbox" class="row-select" value="${esc(s.id)}" aria-label="Select ${esc(s.name)}"></td><td><button class="student-name" data-student="${esc(s.id)}">${avatar(s)}<span><strong>${esc(s.name)}</strong><small>${esc(s.id)}</small></span></button></td><td class="class-cell">${esc(s.className)}</td><td><div class="attendance-value"><span>${s.attendance}%</span><div class="tiny-track"><i style="width:${s.attendance}%" class="${s.attendance < 80 ? 'low' : ''}"></i></div></div></td><td><strong class="score">${s.score}<small>%</small></strong></td><td>${pill(s)}</td><td><button class="icon-button row-more" data-student="${esc(s.id)}" aria-label="View ${esc(s.name)}">${icon('more-horizontal')}</button></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state">No students found.<span>Try another search or adjust your filters.</span></div></td></tr>'}</tbody></table></div><div class="table-footer"><span>${list.length ? `Showing ${(pageNumber - 1) * limit + 1}–${Math.min(pageNumber * limit, list.length)} of ${list.length} students` : '0 students'}<button class="text-button selected-export" data-action="export-selected" hidden>Export selected</button></span><div class="pagination"><button class="page-arrow" data-action="prev-page" ${pageNumber === 1 ? 'disabled' : ''} aria-label="Previous page">${icon('chevron-left')}</button>${Array.from({ length: Math.min(3, pages) }, (_, i) => `<button class="page-number ${pageNumber === i + 1 ? 'current' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('')}${pages > 3 ? `<span>…</span><button class="page-number ${pageNumber === pages ? 'current' : ''}" data-page="${pages}">${pages}</button>` : ''}<button class="page-arrow" data-action="next-page" ${pageNumber === pages ? 'disabled' : ''} aria-label="Next page">${icon('chevron-right')}</button></div></div>`;
}
function studentPanel(full = false) { return `<section class="panel students-panel"><div class="panel-heading"><div class="title-inline"><h2>${full ? 'All students' : 'Student overview'}</h2><span class="count-badge">${state.students.length} students</span></div>${!full ? '<a href="#students" class="text-button">View all students ' + icon('arrow-right') + '</a>' : `<button class="button" data-action="export">${icon('download')} Export list</button>`}</div><div class="table-toolbar"><label class="table-search">${icon('search')}<input id="student-search" placeholder="Search by name or student ID..." value="${esc(search)}" aria-label="Search students"></label><div class="table-filters"><select id="class-filter" aria-label="Filter students by class"><option>All classes</option>${classes.map(c => `<option ${classFilter === c ? 'selected' : ''}>${c}</option>`).join('')}</select><button class="button filter-button ${statusFilter !== 'All statuses' ? 'filter-active' : ''}" data-action="filters">${icon('sliders-horizontal')} Filters${statusFilter !== 'All statuses' ? '<span class="filter-number">1</span>' : ''}</button></div></div><div id="student-table">${studentTable(full ? 10 : 5)}</div></section>`; }
function renderContent() {
  const el = document.querySelector('#main-content');
  if (page === 'Overview') el.innerHTML = heading('A little insight. A lot of potential.', 'Welcome back, Jessica. Here’s how your students are doing today.', `<button class="button date-button" data-action="calendar">${icon('calendar-days')} ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</button>${addButton}`) + metrics() + `<div class="overview-charts">${trendChart()}${performanceChart()}</div><div class="overview-bottom">${studentPanel()}${recentActivity()}</div>`;
  else if (page === 'Students') el.innerHTML = heading('Every student. Every possibility.', 'Get to know your students and keep their progress in view.', addButton) + studentPanel(true);
  else if (page === 'Attendance') renderAttendance(el);
  else if (page === 'Performance') renderPerformance(el);
  else if (page === 'Reports') renderReports(el);
  else renderSettings(el);
  icons();
}
function renderAttendance(el) {
  const list = state.students.filter(s => classFilter === 'All classes' || s.className === classFilter);
  const visibleIds = new Set(list.map(student => student.id));
  const records = Object.fromEntries(Object.entries({ ...(state.attendance[attendanceDate] || {}), ...attendanceDraft }).filter(([id]) => visibleIds.has(id)));
  const present = Object.values(records).filter(v => v === 'Present').length;
  el.innerHTML = heading('Showing up matters.', 'Make every day count. Record and review classroom attendance.', `<button class="button primary" data-action="save-attendance">${icon('save')} Save attendance</button>`) + `<div class="attendance-summary"><div class="panel mini-stat"><span>Students</span><strong>${list.length}</strong></div><div class="panel mini-stat"><span>Marked present</span><strong>${present}</strong></div><div class="panel mini-stat"><span>Records for this day</span><strong>${Object.keys(records).length}</strong></div></div><section class="panel"><div class="panel-heading"><div><h2>Daily attendance</h2><p>${dirtyAttendance ? 'You have unsaved changes.' : 'Choose a date and class to begin.'}</p></div><button class="button" data-action="mark-all">${icon('check')} Mark class present</button></div><div class="table-toolbar"><label class="date-input">${icon('calendar-days')}<input type="date" id="attendance-date" value="${attendanceDate}" max="${today()}" aria-label="Attendance date"></label><select id="class-filter" aria-label="Filter attendance by class"><option>All classes</option>${classes.map(c => `<option ${classFilter === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="attendance-list">${list.map(s => `<div class="attendance-row"><button class="student-name" data-student="${esc(s.id)}">${avatar(s)}<span><strong>${esc(s.name)}</strong><small>${esc(s.className)}</small></span></button><div class="attendance-options">${['Present', 'Absent', 'Late'].map(v => `<button class="attendance-option ${records[s.id] === v ? `chosen ${v.toLowerCase()}` : ''}" data-mark="${v}" data-id="${esc(s.id)}">${records[s.id] === v ? icon('check') : ''}${v}</button>`).join('')}</div></div>`).join('')}</div></section>`;
}
function renderPerformance(el) {
  el.innerHTML = heading('Progress worth paying attention to.', 'Celebrate the milestones. Find the students who need a hand.', `<button class="button" data-action="export">${icon('download')} Export performance</button>`) + metrics() + `<div class="performance-layout">${performanceChart()}<section class="panel class-performance"><div class="panel-heading"><div><h2>Performance by class</h2><p>Average academic score across your campus.</p></div></div><div class="class-bars">${classes.map(c => { const list = state.students.filter(s => s.className === c); const avg = average(list, 'score'); return `<div><div><strong>${c}</strong><span>${avg}% <small>· ${list.length} students</small></span></div><div class="class-track"><span style="width:${avg}%"></span></div></div>`; }).join('')}</div></section></div>` + studentPanel(true);
}
function renderReports(el) {
  el.innerHTML = heading('Clarity for your next step.', 'Turn everyday student data into a useful, shareable picture.') + `<div class="report-grid">${[['Student directory', 'A complete list of your students, classes, and contact information.', 'users', 'directory'], ['Academic performance', 'Student scores, attendance averages, and support indicators.', 'chart-no-axes-combined', 'performance'], ['Attendance records', 'Your saved daily attendance records, ready for a closer look.', 'calendar-check', 'attendance']].map(([name, description, ico, type]) => `<section class="panel report-card"><span class="report-icon">${icon(ico)}</span><h2>${name}</h2><p>${description}</p><span class="report-format">CSV SPREADSHEET</span><button class="button" data-report="${type}">${icon('download')} Download report</button></section>`).join('')}</div><section class="panel report-note">${icon('circle-help')}<div><h2>A note about your workspace</h2><p>Reports use the current student data stored in this browser. The attendance trend on the overview is an illustrative sample; attendance exports include only records you have saved.</p></div></section>`;
}
function renderSettings(el) {
  el.innerHTML = heading('Make yourself at home.', 'Manage the details that make this workspace yours.') + `<section class="panel settings-panel"><div class="panel-heading"><div><h2>Workspace details</h2><p>A familiar home for your school community.</p></div></div><form id="settings-form" class="settings-form"><label>School name<input name="school" required maxlength="60" value="${esc(state.school)}"></label><label>Workspace administrator<input value="Jessica Davis" disabled></label><label>Storage<span class="storage-note">Your data is saved locally in this browser. Export reports to keep a separate copy.</span></label><button class="button primary" type="submit">${icon('check')} Save changes</button></form></section>`;
}
function modal(title, content, wide = false) {
  const root = document.querySelector('#modal-root');
  root.innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-heading"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close-modal" aria-label="Close dialog">${icon('x')}</button></div>${content}</section></div>`;
  document.body.classList.add('modal-open'); icons();
  setTimeout(() => root.querySelector('input:not([disabled]), select, button')?.focus(), 30);
}
function closeModal() { document.querySelector('#modal-root').innerHTML = ''; document.body.classList.remove('modal-open'); }
function studentForm(id) {
  const student = state.students.find(s => s.id === id);
  modal(student ? 'Edit student' : 'A new beginning.', `<p class="modal-description">${student ? 'Keep this student’s information up to date.' : 'Add a student to your campus community.'}</p><form id="student-form" data-edit="${esc(student?.id || '')}"><div class="form-grid"><label class="full">Full name<input name="name" required maxlength="80" placeholder="e.g. Alex Morgan" value="${esc(student?.name || '')}"></label><label class="full">Email address<input type="email" name="email" required maxlength="120" placeholder="alex.morgan@student.campus.edu" value="${esc(student?.email || '')}"></label><label>Class<select name="className">${classes.map(c => `<option ${student?.className === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Average score (%)<input type="number" min="0" max="100" required name="score" value="${student?.score ?? 0}"></label><label>Attendance (%)<input type="number" min="0" max="100" required name="attendance" value="${student?.attendance ?? 100}"></label><label class="full">Teacher notes <span class="optional">(optional)</span><textarea name="notes" maxlength="1000" placeholder="Anything that helps us support this student...">${esc(student?.notes || '')}</textarea></label></div><div class="modal-actions"><button type="button" class="button" data-action="close-modal">Cancel</button><button class="button primary" type="submit">${icon(student ? 'check' : 'plus')}${student ? 'Save changes' : 'Add student'}</button></div></form>`);
}
function viewStudent(id) {
  const s = state.students.find(s => s.id === id); if (!s) return;
  const records = Object.entries(state.attendance).filter(([, items]) => items[id]).sort(([a], [b]) => b.localeCompare(a)).slice(0, 5);
  modal('Student profile', `<div class="student-profile">${avatar(s, 'large')}<h3>${esc(s.name)}</h3><p>${esc(s.id)} · ${esc(s.className)}</p>${pill(s)}</div><div class="profile-stats"><div><span>Attendance</span><strong>${s.attendance}%</strong></div><div><span>Average score</span><strong>${s.score}%</strong></div></div><div class="profile-info"><p>${icon('mail')} ${esc(s.email)}</p><h4>Teacher notes</h4><p>${esc(s.notes) || 'No notes yet. Add a note to support this student’s journey.'}</p>${records.length ? `<h4>Recent attendance</h4>${records.map(([date, items]) => `<div class="record-line"><span>${esc(date)}</span><strong>${esc(items[id])}</strong></div>`).join('')}` : ''}</div><div class="modal-actions"><button class="button" data-action="close-modal">Close</button><button class="button primary" data-edit-student="${esc(s.id)}">Edit student ${icon('arrow-right')}</button></div>`);
}
async function exportCsv(kind = 'performance', selected = null) {
  let rows;
  const list = selected || filteredStudents();
  if (kind === 'attendance') {
    rows = [['Date', 'Student ID', 'Name', 'Class', 'Status']];
    Object.entries(state.attendance).sort().forEach(([date, entries]) => Object.entries(entries).forEach(([id, value]) => { const s = state.students.find(s => s.id === id); if (s) rows.push([date, id, s.name, s.className, value]); }));
    if (rows.length === 1) { toast('Save your first attendance record before exporting.'); return; }
  } else rows = [['Student ID', 'Name', 'Email', 'Class', 'Attendance (%)', 'Average score (%)', 'Status'], ...list.map(s => [s.id, s.name, s.email, s.className, s.attendance, s.score, status(s)])];
  const csv = rows.map(row => row.map(value => { let cell = String(value); if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`; return `"${cell.replaceAll('"', '""')}"`; }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = `campus-${kind}-${today()}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  activity('Report exported', `${kind[0].toUpperCase() + kind.slice(1)} · ${rows.length - 1} records`, 'report'); const saved = await persist(); if (saved) toast('Your report is ready. Download started.');
}
function showSearch() {
  modal('Find your next step', `<label class="modal-search">${icon('search')}<input id="global-search-input" placeholder="Search students or pages..." autocomplete="off"></label><div id="global-results">${navItems.map(([name, ico]) => `<a class="search-result" href="#${name.toLowerCase()}" data-action="close-modal">${icon(ico)}<span>${name}</span>${icon('arrow-right')}</a>`).join('')}</div>`);
  document.querySelector('#global-search-input').focus();
}
function showHelp() { modal('A little guidance, whenever you need it.', `<div class="help-content"><p>Campus brings your students’ progress into one thoughtful workspace.</p><h3>1. Meet your students</h3><p>Visit Students to search, filter, add a student, or open a profile to update scores and notes.</p><h3>2. Make every day count</h3><p>Open Attendance, select a class and date, mark students present, absent, or late, then save your changes.</p><h3>3. See the bigger picture</h3><p>Performance highlights progress and students who may need support. Reports lets you download your data as a spreadsheet.</p><div class="help-note">This workspace starts with sample students. Changes are stored in this browser. Use reports to keep a copy of your work.</div></div><div class="modal-actions"><button class="button primary" data-action="close-modal">Got it ${icon('check')}</button></div>`); }
function updateTable() { document.querySelector('#student-table').innerHTML = studentTable(page === 'Overview' ? 5 : 10); icons(); }
const actions = {
  'add-student': () => studentForm(), 'close-modal': closeModal, 'help': showHelp, 'search': showSearch,
  'menu': () => document.querySelector('.sidebar').classList.toggle('mobile-open'),
  'profile': () => modal('Your workspace profile', `<div class="student-profile"><span class="profile-avatar large">JD</span><h3>Jessica Davis</h3><p>Administrator · ${esc(state.school)}</p></div><div class="help-note">You’re exploring the local Campus workspace. Student data and preferences are saved in this browser.</div><div class="modal-actions"><a class="button primary" href="#settings" data-action="close-modal">Workspace settings ${icon('settings')}</a></div>`),
  'notifications': () => { const list = state.students.filter(s => status(s) === 'At risk'); modal('A little attention goes a long way.', `<p class="modal-description">${list.length} students could use some extra support.</p><div class="notification-list">${list.slice(0, 6).map(s => `<button class="search-result" data-student="${esc(s.id)}">${avatar(s)}<span><strong>${esc(s.name)}</strong><small>${s.attendance}% attendance · ${s.score}% average</small></span>${icon('chevron-right')}</button>`).join('')}</div><div class="modal-actions"><button class="button primary" data-status="At risk">View all at-risk students ${icon('arrow-right')}</button></div>`); },
  'calendar': () => { location.hash = 'attendance'; },
  'performance': () => { location.hash = 'performance'; },
  'export': () => exportCsv(),
  'export-selected': () => exportCsv('students', [...document.querySelectorAll('.row-select:checked')].map(el => state.students.find(s => s.id === el.value))),
  'prev-page': () => { pageNumber--; updateTable(); }, 'next-page': () => { pageNumber++; updateTable(); },
  'filters': () => modal('Find the right students', `<form id="filter-form"><label>Student status<select name="status">${['All statuses', 'Excellent', 'On track', 'At risk'].map(s => `<option ${statusFilter === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><div class="modal-actions"><button class="button" type="button" data-action="reset-filters">Reset filters</button><button class="button primary" type="submit">Apply filters ${icon('check')}</button></div></form>`),
  'reset-filters': () => { classFilter = 'All classes'; statusFilter = 'All statuses'; search = ''; pageNumber = 1; closeModal(); renderContent(); },
  'mark-all': () => { state.students.filter(s => classFilter === 'All classes' || s.className === classFilter).forEach(s => { attendanceDraft[s.id] = 'Present'; }); dirtyAttendance = true; renderContent(); toast('Class marked present. Save to keep your changes.'); },
  'save-attendance': async () => { if (!Object.keys(attendanceDraft).length) { toast('Mark at least one student before saving.'); return; } state.attendance[attendanceDate] = { ...(state.attendance[attendanceDate] || {}), ...attendanceDraft }; activity('Attendance recorded', `${Object.keys(attendanceDraft).length} students · ${attendanceDate}`, 'attendance'); attendanceDraft = {}; dirtyAttendance = false; const saved = await persist(); renderContent(); if (saved) toast('Attendance saved. Every day counts.'); },
  'all-activity': () => modal('Your campus activity', `<div class="full-activity">${state.activities.length ? state.activities.map(a => `<div class="activity-item"><span class="activity-icon purple">${icon('clock-3')}</span><div><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p><small>${relativeTime(a.time)}</small></div></div>`).join('') : '<div class="empty-state">A fresh start.<span>Add a student or save attendance to see your activity here.</span></div>'}</div>`),
};
document.addEventListener('click', event => {
  const target = event.target.closest('[data-action], [data-student], [data-edit-student], [data-page], [data-status], [data-mark], [data-report]');
  if (!target) { if (event.target.classList.contains('modal-backdrop')) closeModal(); return; }
  if (target.dataset.action) actions[target.dataset.action]?.();
  else if (target.dataset.student) viewStudent(target.dataset.student);
  else if (target.dataset.editStudent) studentForm(target.dataset.editStudent);
  else if (target.dataset.page) { pageNumber = Number(target.dataset.page); updateTable(); }
  else if (target.dataset.status) { statusFilter = target.dataset.status; classFilter = 'All classes'; search = ''; pageNumber = 1; closeModal(); if (page === 'Students') renderContent(); else location.hash = 'students'; }
  else if (target.dataset.mark) { attendanceDraft[target.dataset.id] = target.dataset.mark; dirtyAttendance = true; const scroll = window.scrollY; renderContent(); window.scrollTo(0, scroll); document.querySelector(`[data-mark="${CSS.escape(target.dataset.mark)}"][data-id="${CSS.escape(target.dataset.id)}"]`)?.focus({ preventScroll: true }); }
  else if (target.dataset.report) exportCsv(target.dataset.report, state.students);
});
document.addEventListener('input', event => {
  if (event.target.id === 'student-search') { search = event.target.value; pageNumber = 1; updateTable(); }
  if (event.target.id === 'global-search-input') {
    const q = event.target.value.toLowerCase();
    const students = state.students.filter(s => `${s.name} ${esc(s.id)}`.toLowerCase().includes(q)).slice(0, 5);
    const pages = navItems.filter(([name]) => name.toLowerCase().includes(q));
    document.querySelector('#global-results').innerHTML = pages.map(([name, ico]) => `<a href="#${name.toLowerCase()}" class="search-result" data-action="close-modal">${icon(ico)}<span>${name}</span>${icon('arrow-right')}</a>`).join('') + students.map(s => `<button class="search-result" data-student="${esc(s.id)}">${avatar(s)}<span><strong>${esc(s.name)}</strong><small>${esc(s.id)} · ${esc(s.className)}</small></span>${icon('arrow-right')}</button>`).join('') || '<div class="empty-state">No matches found.</div>'; icons();
  }
});
document.addEventListener('change', event => {
  const el = event.target;
  if (el.id === 'class-filter') { classFilter = el.value; pageNumber = 1; renderContent(); }
  if (el.id === 'chart-period') { chartPeriod = el.value; renderContent(); }
  if (el.id === 'attendance-date') {
    if (dirtyAttendance) { el.value = attendanceDate; toast('Save your current attendance before changing the date.'); return; }
    if (!el.value || el.value > today()) { el.value = attendanceDate; return; }
    attendanceDate = el.value; attendanceDraft = {}; renderContent();
  }
  if (el.id === 'select-all') document.querySelectorAll('.row-select').forEach(cb => { cb.checked = el.checked; });
  if (el.id === 'select-all' || el.classList.contains('row-select')) { const all = [...document.querySelectorAll('.row-select')]; const selected = all.filter(cb => cb.checked); document.querySelector('.selected-export').hidden = !selected.length; const master = document.querySelector('#select-all'); master.checked = selected.length === all.length && !!all.length; master.indeterminate = selected.length > 0 && selected.length < all.length; }
});
document.addEventListener('submit', async event => {
  if (!['student-form', 'settings-form', 'filter-form'].includes(event.target.id)) return;
  event.preventDefault(); const form = event.target; const data = Object.fromEntries(new FormData(form));
  if (form.id === 'student-form') {
    if (!data.name.trim() || !data.email.trim()) { toast('Enter a name and email address.'); return; }
    const existing = state.students.find(s => s.id === form.dataset.edit);
    const s = { ...existing, ...data, name: data.name.trim(), email: data.email.trim(), score: Number(data.score), attendance: Number(data.attendance) };
    if (!existing) {
      s.id = `ST-${Array.from(crypto.getRandomValues(new Uint8Array(6)), byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
      s.color = 'purple'; s.joined = today();
    }
    const saved = await persist(next => {
      const index = next.students.findIndex(student => student.id === s.id);
      const changes = existing ? Object.fromEntries(Object.entries(s).filter(([key, value]) => value !== existing[key])) : s;
      const updated = { ...(next.students[index] || s), ...changes };
      const email = updated.email.trim().toLowerCase();
      if (next.students.some(student => student.id !== updated.id && student.email.trim().toLowerCase() === email)) {
        toast('A student with this email address already exists.');
        return false;
      }
      if (index >= 0) next.students[index] = updated;
      else next.students.unshift(updated);
      next.activities.unshift({ title: existing ? 'Student profile updated' : 'A new student joined Campus', detail: `${updated.name} · ${updated.className}`, type: 'student', time: Date.now() });
      next.activities = next.activities.slice(0, 30);
      return true;
    });
    if (saved === 'invalid') return;
    closeModal(); shell(); if (saved) toast(existing ? 'Student profile updated.' : `${s.name} is now part of your campus.`);
  }
  if (form.id === 'filter-form') { statusFilter = data.status; pageNumber = 1; closeModal(); renderContent(); }
  if (form.id === 'settings-form') { if (!data.school.trim()) { toast('Please enter a school name.'); return; } state.school = data.school.trim(); const saved = await persist(); shell(); if (saved) toast('Your workspace details have been updated.'); }
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'k') { event.preventDefault(); showSearch(); }
  if (event.key === 'Escape') { closeModal(); document.querySelector('.sidebar')?.classList.remove('mobile-open'); }
  if (event.key === 'Tab' && document.querySelector('.modal')) { const nodes = [...document.querySelector('.modal').querySelectorAll('button, input, select, textarea, a[href]')].filter(el => !el.disabled); const first = nodes[0], last = nodes.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
});
window.addEventListener('beforeunload', event => { if (dirtyAttendance) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('hashchange', route);
function route() { const requested = location.hash.slice(1).toLowerCase(); page = [...navItems.map(([name]) => name), 'Settings'].find(name => name.toLowerCase() === requested) || 'Overview'; pageNumber = 1; search = ''; closeModal(); shell(); window.scrollTo(0, 0); }
route();
