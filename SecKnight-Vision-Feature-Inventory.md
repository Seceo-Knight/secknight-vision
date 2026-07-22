# SecKnight Vision — Full Feature Inventory (Tab by Tab)

Every sidebar tab and its actual widgets/features, based on a direct read of the frontend source.

---

## Dashboard
Stats cards (Total Enrollments, Currently Active, Currently Idle, Currently Offline, Absent, Suspended); Today's Activity Snapshot; Activity Break Down (Today/Yesterday/This Week); EMP-AI Insights panel (conditional); Top 10 Productive Employees (location/department/period filters + view report + AI insight + PDF export); Top 10 Non-Productive Employees (same); Top 10 Active Employees (same); Top 10 Non-Active Employees (same); Location Performance; Department Performance; Top 10 Web Usage; Top 10 App Usage; "Download Full Report" combined PDF export (Today/Yesterday/This Week).

---

## Employees (group)

**Employee Details**
Tabs: Active / Suspended (+ "Deleted User History" modal). Filters: Role, Location, Department, Shift. Toolbar: Register Employee, Bulk Register (CSV), Bulk Update, Bulk Delete, Deleted User History. Table: name/avatar, email, location, department, shift, role badge, emp code, OS, computer name, agent version. Row actions: track-settings gear, Edit, Suspend/Restore, Delete, View Assigned Managers. Bulk action bar (on selection): Bulk Delete, Bulk Suspend, Assign Shift, Assign Manager, Bulk Restore. Search, page-size, CSV export, pagination. Row click → Employee Profile.

**Employee Comparison**
Side-by-side comparison of two employees (or one employee, two periods). Each side: Employee dropdown + date-range picker, donut chart (Productive/Unproductive/Neutral/Other), 6 stat tiles (Office/Unproductive/Active/Neutral/Productive Time, Productivity %).

**Employee Attendance**
Full-month calendar-grid table (one column per day) with per-day status codes (P/A/L/H/O/D/EL + legend tooltip). Filters: Month/Year, Location, Department. Sortable columns. Search, show-entries, Export to Excel, pagination. Summary totals per employee (Present/Late/Half-day/Absent/Overtime/Day-off/Early-logout).

**Employee Insights**
Single-employee, single-date view. Filters: Date, Role, Location, Department, Employee. Current Location line; graph cards for Office/Productive/Unproductive Time (today), Productive-Time-Stats (today vs yesterday), Productivity % (today vs yesterday vs org average).

**Real-Time Track**
Live card grid (WebSocket), online-first sort, search, min/max productivity slider. Per card: Analytics jump-to-profile icon, Download icon (branded single-employee PDF: status, productivity, office/active/idle hours, live activity — title/app/URL/lat-long).

---

## Timesheets
Attendance/productivity register. Filters: Location, Department, Employee, Shift, Date range. Column-visibility toggle (25 possible columns). CSV/PDF export, each with its own per-column picker. Show-entries, search, sortable table, pagination.

---

## Live Monitoring
Grid of employee cards with **live streaming screen thumbnails** (WebSocket canvas), online/offline badge. Filters: Location, Department, Employee, search. Card click → full-screen modal: live canvas, multi-monitor switcher, fullscreen, "Load Recordings" panel (date + time) that switches to a past-recording video player with scrollable thumbnail filmstrip and Auto-Play toggle.

---

## Time Claim
Request-type tabs: Idle, Offline, Break, Attendance. Filters: Date range, Status (All/Pending/Approved/Declined), Auto-Approve toggle. Bulk select → Approve/Decline Selected. Row View modal: full request detail + activity/app-usage breakdown (Idle), inline Approve/Decline. Delete (pending only). Search, show-entries, pagination. (Admin view — no "Create Request," review/approve only.)

---

## Reports (group)

**Reports Download**
Filters: Role, Location, Department, Date range, Download Option. Bulk row select. "Generate CSV" with column picker → downloadable links. Per-row Print → single-employee branded PDF (application/browser/both). Sortable table, search, pagination.

**Productivity Report**
Filters: Location, Department, Employee, Date range. Stacked bar chart (Productive/Unproductive/Neutral hours per employee). Table: office time, productive/unproductive hrs+%, neutral hrs, idle time, row checkboxes. CSV/PDF export. Show-entries, pagination.

**Auto Email Report**
CRUD list of scheduled email reports: Title, Frequency badge, Recipients (expandable chips), Content badges, Filter Type. "Create New Report" dialog (recipients/frequency/content/filters). Edit, Delete. Sortable, search, pagination.

**Web/App Usage**
Two-panel: left = Both/Website/Application tabs, search, infinite-scroll ranking table (color-coded ranking, duration; "customization"-status rows open a department-breakdown modal). Right = gradient bar chart of top usage. Filters: Location, Department, Employee, Date range (30-day max). Excel/PDF export. Below: paginated cumulative per-employee usage table (productive/unproductive/neutral/idle time) with its own Excel export.

---

## DLP (group)

**USB Detection**
Filters: Location, Department, Employee, Date range, CSV/PDF export. Table: employee, employee ID, computer, location, department, event title badge, date/time, parsed description (file/app/block reason). Show-entries, search, pagination.

**System Logs**
Same filter/export pattern as USB Detection. Table: checkbox-select, employee, computer, event date/time, description (login/logoff, USB, policy triggers, etc.).
*(Note: a separate, unfinished `system-activity-log` page also exists in the codebase but is just a "Coming Soon" stub not linked from any menu — don't confuse it with this real System Logs tab.)*

**Email Activity Logs**
Filters: Location, Department, Employee, Email Type (Sent/Received/Click Event/Page Visit), Date range, CSV/PDF export. Email view: To/From/CC/BCC, Subject, Body, Attachments, Event date, "Eye" detail modal. Web-activity view: Page Title, URL, Label, Start/End time. Show-entries, search, pagination.

---

## Settings (group)

**Location/Department Management**
Table of Locations with expandable colored Department chips. Search. "Add Location + Departments," "Delete Departments." Per-row menu: Rename Location, Add Department, Remove Department, Delete Location. Pagination.

**Storage Types**
Table of configured storage backends: Type, Status badge, Note. Add button + per-row menu (Edit, Delete, Activate). Delete confirm dialog.

**Productivity Rules**
Modes: Activity view / Category view. Tabs: See All / Global / Custom / New. Sub-toggle (Activity mode): Website/Application. Productivity Category filter. Actions: Add New Domain, Export (Excel/CSV/PDF), Import, Bulk Import. Table: activity + type icon, inline Productive/Neutral/Unproductive ranking buttons, "Customize by Department" expandable override rows, "Always Active" time-exemption dialog, "View Usage" history dialog. Search, show-entries, pagination.

**Roles & Permissions**
Table: Role name, Read/Write/Delete toggles (Read locked), Location scope, Department scope (+N chips), Actions (Edit, Delete, Clone — hidden for system roles), Permission Settings dialog (granular per-module), View Details. "Add New Role." Search, show-entries, pagination.

**Shift Management**
Table: shift name + color dot, Days chips, Start/End Time badges, Edit/Delete. Create/Edit Shift dialog, delete-confirm. Export (PDF/Excel/CSV). Search, show-entries, pagination.

**Monitoring Control**
Global settings: Custom Productivity Time dropdown, Productivity Category dropdown (save immediately, toast feedback). Groups table (Default + custom groups): scope (Role/Location/Department/Employee count), "Monitoring Settings" gear (what to track/capture), Actions (Settings, Edit, Delete). "Create Group." Search, show-entries, pagination.

**Localization**
Timezone dropdown, Language dropdown, Save. Export (PDF/Excel/CSV). Auto-dismissing success/error banners.

---

## Behaviour (group)

**Alerts** (rule builder — also reached from Alert Policies' "Add/Edit")
Rule Trigger section: rule name, "apply to new registrations" checkboxes, multi-select Location/Department/Employee scope, "What Triggers The Rule" dropdown (daily-work-time, screen-events, idle, offline, absent, website/app-visit, always-active, etc.), dynamic condition builder (type/operator/value, add/remove rows), optional Website/App target, notes. Rule Risk Level section: 5-level risk selector (color-coded), "Multiple Alerts per Day" toggle, "Desktop Notification" toggle, multi-select "Whom to notify" chips. Save & Launch.

**Alert Policies**
List of saved rules. Bulk select → Apply Selected/All. "Add New Alert." Table: date/time, rule name (risk-color border), Notify-As, Conditions, Applies-To (expandable chips), Recipients chips, Edit (reloads into builder), Delete. Sortable, search, show-entries, pagination.

**Alert Notification**
Read-only fired-alerts log. Filters: Location, Department, Employee, Date range. Columns: Date/Time, Employee, Computer/Emp Code, Rule Name, Triggered Point, Action, Risk Level (color-coded). Search, show-entries, pagination.

---

## Employee Profile (drill-down, reached from Employee Details / Real-Time Track / Timesheets)

Header: avatar, name, Edit badge, Settings badge (→ track-user-settings), shared date-range picker. 8 tabs:

- **Productivity** — 6 stat cards, daily timeline bar (productive/neutral/idle/offline), stacked bar chart across the date range.
- **Timesheets** — per-day table (clock in/out, total/office/active/productive/unproductive/neutral/idle/offline hours, productivity %). Search, pagination.
- **App History** — Top-5 apps + donut chart, full table (app, window title, start/end time, active/idle/total time, productive/unproductive type).
- **Web History** — Top-5 domains + donut chart, full table (browser, page title, URL, start/end time, active time).
- **Screenshots** — date + hour-range filters, hourly thumbnail buckets, lightbox with prev/next keyboard nav.
- **Screen Cast** — live remote-view/control: Connect/Disconnect, online badge, latency test, screen-size selector, multi-monitor canvas with mouse/keyboard remote control, shortcut taskbar (Win, File Explorer, Run, Copy, Paste, Lock, Restart, Shutdown), on-demand screenshot, start/stop screen recording (downloads webm).
- **Screen Recording** — date + hour-range filters, hourly video thumbnails, full-screen playback overlay.
- **Web/Key Strokes** — table of logged keystrokes (type, app/domain, keystroke text, start/end time, duration).

---

## Unwired / extra pages (exist in code, not in the sidebar menu)

- **Clients** — "Coming Soon" placeholder, no functionality yet.
- **Reseller Dashboard** — reseller/partner console: client org table, Register/Edit Client, View Assigned Employees, per-client storage-quota toggle, remove client, client-login impersonation.
- **Addon Features** — super-admin/operator-only feature gating: per-feature summary cards, Enable/Disable-All, org × feature toggle matrix, search/filter, feature CRUD manager.
- **Employee Notification** — notification/attendance-style table, still on mock/placeholder data.
- **Print Logs** — DLP-style print-activity log (same filter/export pattern as USB/System/Email logs), currently mock data.
- **Mobile Task — Geolocation** — GPS tracking for field workforce: employee selector, status filter, date range, map + total task time.
- **Mobile Task — Clients** — CRUD table of client "projects" for field-task assignment, bulk CSV import, assign-all-employees.
- **Mobile Task — Details** — CRUD table of individual field tasks, filters, CSV download (individual + consolidated), bulk import.
- **System Activity Log** — separate "Coming Soon" stub, not linked anywhere (distinct from the real DLP "System Logs" tab).
- Also present but not detailed above: Reseller Settings, Track User Settings (per-employee monitoring toggle, reached via gear icons), Timeline, Screenshot Logs (DLP-style, commented out of the sidebar).

---

*Note: none of this data will actually populate until a working desktop agent is deployed and reporting to the backend — see the earlier agent-compatibility investigation.*
