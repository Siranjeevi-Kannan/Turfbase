const API = "http://localhost:3000";

/* ----------------------------------------------------------------
   NAVIGATION
---------------------------------------------------------------- */
const PAGE_TITLES = {
  overview: 'Dashboard',
  users:    'User Management',
  courts:   'Court Management',
  sports:   'Sport Management',
  slots:    'Slot Management',
  bookings: 'Booking Management',
  payments: 'Payment Management',
  staff:    'Staff Management',
  feedback: 'Feedback Management'
};

function goTo(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbar-title').textContent = PAGE_TITLES[page];
  if (page === 'overview') loadStats();
}

function quickNav(page) {
  const btn = [...document.querySelectorAll('.sb-item')]
    .find(b => b.textContent.trim().toLowerCase().includes(page));
  goTo(page, btn);
}

/* ----------------------------------------------------------------
   TABS
---------------------------------------------------------------- */
function tab(page, pane, btn) {
  document.querySelectorAll(`#page-${page} .tab`).forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`#page-${page} .tab-pane`).forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`${page}-${pane}`).classList.add('active');
}

/* ----------------------------------------------------------------
   TOAST
---------------------------------------------------------------- */
function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3400);
}

/* ----------------------------------------------------------------
   CONFIRM MODAL — used for all deletes
---------------------------------------------------------------- */
function confirmDelete(entityName, warningText, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-icon">⚠️</div>
      <div class="modal-title">Delete ${entityName}?</div>
      <div class="modal-desc">
        ${warningText}
        <br><br>
        <strong>This action cannot be undone.</strong>
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="modal-cancel">Cancel</button>
        <button class="btn btn-danger" id="modal-confirm">Yes, Delete</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('modal-cancel').onclick = () => overlay.remove();
  document.getElementById('modal-confirm').onclick = () => { overlay.remove(); onConfirm(); };
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

/* ----------------------------------------------------------------
   TABLE RENDER
---------------------------------------------------------------- */
function renderTable(id, data, colCount) {
  const tbody = document.getElementById(id);
  const cols = colCount || tbody.closest('table').querySelectorAll('th').length;
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-row">No records found</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(r =>
    '<tr>' + r.map(v => `<td>${v ?? '—'}</td>`).join('') + '</tr>'
  ).join('');
}

/* ----------------------------------------------------------------
   TABLE SEARCH FILTER
---------------------------------------------------------------- */
function filterTable(tbodyId, query) {
  const tbody = document.getElementById(tbodyId);
  const q = query.toLowerCase();
  tbody.querySelectorAll('tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ----------------------------------------------------------------
   OVERVIEW STATS
---------------------------------------------------------------- */
async function loadStats() {
  const map = {
    users:    'stat-users',
    courts:   'stat-courts',
    sports:   'stat-sports',
    bookings: 'stat-bookings',
    payments: 'stat-payments'
  };
  for (const [ep, id] of Object.entries(map)) {
    try {
      const r = await fetch(`${API}/${ep}`);
      const d = await r.json();
      document.getElementById(id).textContent = Array.isArray(d) ? d.length : '—';
    } catch {
      document.getElementById(id).textContent = '—';
    }
  }
}

/* ----------------------------------------------------------------
   QUICK SLOT CHECK (Overview panel)
---------------------------------------------------------------- */
async function quickSlotCheck() {
  const courtId = document.getElementById('ov-court').value.trim();
  const date    = document.getElementById('ov-date').value;
  const wrap    = document.getElementById('ov-slots');

  if (!courtId) { toast('Enter a Court ID to check slots', 'warn'); return; }

  try {
    let url = `${API}/slots?court=${encodeURIComponent(courtId)}&avail=Available`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    const r = await fetch(url);
    const d = await r.json();

    if (!d || d.length === 0) {
      wrap.innerHTML = '<p style="font-size:12px;color:var(--text-soft);margin-top:6px;">No available slots found for this court.</p>';
      return;
    }
    wrap.innerHTML = `
      <p style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:8px;">
        ${d.length} available slot${d.length > 1 ? 's' : ''} found
      </p>
      <div class="slot-grid">${d.map(row => `
        <div class="slot-pill avail">
          <div class="slot-num">Slot ${row[1]}</div>
          <div class="slot-time">${row[3] ?? ''} &ndash; ${row[4] ?? ''}</div>
          <div class="slot-badge"><span class="badge b-green">Available</span></div>
        </div>`).join('')}
      </div>`;
  } catch {
    wrap.innerHTML = '<p style="font-size:12px;color:var(--danger);margin-top:6px;">Could not load slots. Check that /slots route exists on the backend.</p>';
  }
}

/* ================================================================
   USERS
   Routes: GET /users  POST /users  PUT /users/:id  DELETE /users/:id
   Update: First_Name, Last_Name, Email  (not User_ID — primary key)
   Delete: cascades payments → bookings → feedback → phones → user
================================================================ */
async function insertUser() {
  const id    = document.getElementById('u-id').value.trim();
  const email = document.getElementById('u-email').value.trim();
  const fname = document.getElementById('u-fname').value.trim();
  const lname = document.getElementById('u-lname').value.trim();
  if (!id || !fname) { toast('User ID and First Name are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, fname, lname, email })
    });
    const d = await r.json();
    toast(d.message || 'User inserted');
    ['u-id','u-email','u-fname','u-lname'].forEach(x => document.getElementById(x).value = '');
    loadUsers();
  } catch { toast('Failed to insert user', 'error'); }
}

async function loadUsers() {
  try {
    const r = await fetch(`${API}/users`);
    renderTable('body-users', await r.json());
  } catch { toast('Failed to load users', 'error'); }
}

async function updateUser() {
  const id    = document.getElementById('uu-id').value.trim();
  const fname = document.getElementById('uu-fname').value.trim();
  const lname = document.getElementById('uu-lname').value.trim();
  const email = document.getElementById('uu-email').value.trim();
  if (!id) { toast('Enter the User ID to update', 'warn'); return; }
  if (!fname && !lname && !email) { toast('Fill in at least one field to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fname, lname, email })
    });
    const d = await r.json();
    toast(d.message || 'User updated');
    loadUsers();
  } catch { toast('Failed to update user', 'error'); }
}

function deleteUser() {
  const id = document.getElementById('ud-id').value.trim();
  if (!id) { toast('Enter a User ID', 'warn'); return; }
  confirmDelete(
    `User ${id}`,
    `All bookings, payments, feedback and phone numbers linked to user <strong>${id}</strong> will also be permanently removed.`,
    async () => {
      try {
        const r = await fetch(`${API}/users/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'User deleted');
        document.getElementById('ud-id').value = '';
        loadUsers();
      } catch { toast('Failed to delete user', 'error'); }
    }
  );
}

/* ================================================================
   COURTS
   Routes: GET /courts  POST /courts  PUT /courts/:id  DELETE /courts/:id
   Update: Court_Name, Block, Floor, Capacity, Rate, Status  (not Court_ID)
   Delete: cascades payments → bookings → slots → court_sport → staff → court
================================================================ */
async function insertCourt() {
  const id     = document.getElementById('c-id').value.trim();
  const name   = document.getElementById('c-name').value.trim();
  const block  = document.getElementById('c-block').value.trim() || 'A';
  const floor  = document.getElementById('c-floor').value.trim() || 'Ground';
  const cap    = document.getElementById('c-cap').value || 10;
  const rate   = document.getElementById('c-rate').value || 1000;
  const status = document.getElementById('c-status').value;
  if (!id || !name) { toast('Court ID and Name are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/courts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, block, floor, capacity: cap, rate, status })
    });
    const d = await r.json();
    toast(d.message || 'Court inserted');
    ['c-id','c-name','c-block','c-floor','c-cap','c-rate'].forEach(x => document.getElementById(x).value = '');
    loadCourts();
  } catch { toast('Failed to insert court', 'error'); }
}

async function loadCourts() {
  try {
    const r = await fetch(`${API}/courts`);
    renderTable('body-courts', await r.json());
  } catch { toast('Failed to load courts', 'error'); }
}

async function updateCourt() {
  const id     = document.getElementById('cu-id').value.trim();
  const name   = document.getElementById('cu-name').value.trim();
  const block  = document.getElementById('cu-block').value.trim();
  const floor  = document.getElementById('cu-floor').value.trim();
  const cap    = document.getElementById('cu-cap').value;
  const rate   = document.getElementById('cu-rate').value;
  const status = document.getElementById('cu-status').value;
  if (!id) { toast('Enter the Court ID to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/courts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, block, floor, capacity: cap, rate, status })
    });
    const d = await r.json();
    toast(d.message || 'Court updated');
    loadCourts();
  } catch { toast('Failed to update court', 'error'); }
}

function deleteCourt() {
  const id = document.getElementById('cd-id').value.trim();
  if (!id) { toast('Enter a Court ID', 'warn'); return; }
  confirmDelete(
    `Court ${id}`,
    `All slots, bookings, payments, staff and sport mappings linked to court <strong>${id}</strong> will be permanently removed.`,
    async () => {
      try {
        const r = await fetch(`${API}/courts/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'Court deleted');
        document.getElementById('cd-id').value = '';
        loadCourts();
      } catch { toast('Failed to delete court', 'error'); }
    }
  );
}

/* ================================================================
   SPORTS
   Routes: GET /sports  POST /sports  PUT /sports/:id  DELETE /sports/:id
   Update: Sport_Name, Required_Players, Rules  (not Sport_ID)
   Delete: cascades court_sport → sport
================================================================ */
async function insertSport() {
  const id      = document.getElementById('sp-id').value.trim();
  const name    = document.getElementById('sp-name').value.trim();
  const players = document.getElementById('sp-players').value || 10;
  const rules   = document.getElementById('sp-rules').value.trim() || 'Standard rules apply.';
  if (!id || !name) { toast('Sport ID and Name are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/sports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, players, rules })
    });
    const d = await r.json();
    toast(d.message || 'Sport inserted');
    ['sp-id','sp-name','sp-players','sp-rules'].forEach(x => document.getElementById(x).value = '');
    loadSports();
  } catch { toast('Failed to insert sport', 'error'); }
}

async function loadSports() {
  try {
    const r = await fetch(`${API}/sports`);
    renderTable('body-sports', await r.json());
  } catch { toast('Failed to load sports', 'error'); }
}

async function updateSport() {
  const id      = document.getElementById('su-id').value.trim();
  const name    = document.getElementById('su-name').value.trim();
  const players = document.getElementById('su-players').value;
  const rules   = document.getElementById('su-rules').value.trim();
  if (!id) { toast('Enter the Sport ID to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/sports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, players, rules })
    });
    const d = await r.json();
    toast(d.message || 'Sport updated');
    loadSports();
  } catch { toast('Failed to update sport', 'error'); }
}

function deleteSport() {
  const id = document.getElementById('sd-id').value.trim();
  if (!id) { toast('Enter a Sport ID', 'warn'); return; }
  confirmDelete(
    `Sport ${id}`,
    `The sport <strong>${id}</strong> will be removed from all court mappings (COURT_SPORT) and then deleted.`,
    async () => {
      try {
        const r = await fetch(`${API}/sports/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'Sport deleted');
        document.getElementById('sd-id').value = '';
        loadSports();
      } catch { toast('Failed to delete sport', 'error'); }
    }
  );
}

/* ================================================================
   SLOTS
   Routes: GET /slots?court=&date=&avail=
           POST /slots
           PUT  /slots/:court/:num
           DELETE /slots/:court/:num
   Update: Slot_Date, Start_Time, End_Time, Availability  (not Court_ID/Slot_Number — composite PK)
   Delete: cascades payments → booking → slot
================================================================ */
async function loadSlots() {
  const court = document.getElementById('sf-court').value.trim();
  const date  = document.getElementById('sf-date').value;
  const avail = document.getElementById('sf-avail').value;

  let url = `${API}/slots?`;
  if (court) url += `court=${encodeURIComponent(court)}&`;
  if (date)  url += `date=${encodeURIComponent(date)}&`;
  if (avail) url += `avail=${encodeURIComponent(avail)}&`;

  try {
    const r = await fetch(url);
    const d = await r.json();
    renderTable('body-slots', d);

    const viz = document.getElementById('slot-visual');
    if (!d || d.length === 0) { viz.innerHTML = ''; return; }
    viz.innerHTML = `
      <div class="card">
        <div class="card-title">Slot Visual</div>
        <div class="slot-grid">${d.map(row => {
          const isAvail = (row[5] || '').toLowerCase() === 'available';
          return `<div class="slot-pill ${isAvail ? 'avail' : 'booked'}">
            <div class="slot-num">Slot ${row[1]}</div>
            <div class="slot-time">${row[3] || '—'} &ndash; ${row[4] || '—'}</div>
            <div class="slot-badge"><span class="badge ${isAvail ? 'b-green' : 'b-red'}">${row[5] || '—'}</span></div>
          </div>`;
        }).join('')}
        </div>
      </div>`;
  } catch {
    toast('Could not load slots — check /slots route on backend', 'warn');
    document.getElementById('body-slots').innerHTML =
      '<tr><td colspan="6" class="empty-row">Route not available. See backend note.</td></tr>';
  }
}

function clearSlots() {
  ['sf-court', 'sf-date'].forEach(x => document.getElementById(x).value = '');
  document.getElementById('sf-avail').value = '';
  document.getElementById('body-slots').innerHTML =
    '<tr><td colspan="6" class="empty-row">Use the filter above to search slots</td></tr>';
  document.getElementById('slot-visual').innerHTML = '';
}

async function insertSlot() {
  const court = document.getElementById('sli-court').value.trim();
  const num   = document.getElementById('sli-num').value;
  const date  = document.getElementById('sli-date').value;
  const start = document.getElementById('sli-start').value;
  const end   = document.getElementById('sli-end').value;
  const avail = document.getElementById('sli-avail').value;
  if (!court || !num) { toast('Court ID and Slot Number are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ court, num: parseInt(num), date, start, end, avail })
    });
    const d = await r.json().catch(() => ({}));
    toast(d.message || 'Slot inserted');
    ['sli-court','sli-num','sli-date','sli-start','sli-end'].forEach(x => document.getElementById(x).value = '');
  } catch { toast('Failed to insert slot', 'error'); }
}

async function updateSlot() {
  const court = document.getElementById('slu-court').value.trim();
  const num   = document.getElementById('slu-num').value;
  const avail = document.getElementById('slu-avail').value;
  const date  = document.getElementById('slu-date').value;
  const start = document.getElementById('slu-start').value;
  const end   = document.getElementById('slu-end').value;
  if (!court || !num) { toast('Court ID and Slot Number are required to identify the slot', 'warn'); return; }
  try {
    const r = await fetch(`${API}/slots/${court}/${num}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avail, date, start, end })
    });
    const d = await r.json().catch(() => ({}));
    toast(d.message || 'Slot updated');
  } catch { toast('Failed to update slot', 'error'); }
}

function deleteSlot() {
  const court = document.getElementById('sld-court').value.trim();
  const num   = document.getElementById('sld-num').value;
  if (!court || !num) { toast('Court ID and Slot Number are required', 'warn'); return; }
  confirmDelete(
    `Slot ${num} (Court ${court})`,
    `Any booking and payment tied to slot <strong>${num}</strong> on court <strong>${court}</strong> will also be removed.`,
    async () => {
      try {
        const r = await fetch(`${API}/slots/${court}/${num}`, { method: 'DELETE' });
        const d = await r.json().catch(() => ({}));
        toast(d.message || 'Slot deleted');
        document.getElementById('sld-court').value = '';
        document.getElementById('sld-num').value = '';
      } catch { toast('Failed to delete slot', 'error'); }
    }
  );
}

/* ================================================================
   BOOKINGS
   Routes: GET /bookings  POST /bookings  PUT /bookings/:id  DELETE /bookings/:id
   Update: Booking_Status only (User_ID, Court_ID, Slot_Number are FKs; Booking_ID is PK)
   Delete: cascades payment → booking
================================================================ */
async function insertBooking() {
  const id     = document.getElementById('b-id').value.trim();
  const status = document.getElementById('b-status').value;
  const user   = document.getElementById('b-user').value.trim();
  const court  = document.getElementById('b-court').value.trim();
  const slot   = document.getElementById('b-slot').value;
  if (!id || !user || !court || !slot) { toast('All fields are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, user, court, slot: parseInt(slot) })
    });
    const d = await r.json();
    toast(d.message || 'Booking inserted');
    ['b-id','b-user','b-court','b-slot'].forEach(x => document.getElementById(x).value = '');
    loadBookings();
  } catch { toast('Failed to insert booking', 'error'); }
}

async function loadBookings() {
  try {
    const r = await fetch(`${API}/bookings`);
    renderTable('body-bookings', await r.json());
  } catch { toast('Failed to load bookings', 'error'); }
}

async function updateBooking() {
  const id     = document.getElementById('bu-id').value.trim();
  const status = document.getElementById('bu-status').value;
  if (!id) { toast('Enter the Booking ID to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const d = await r.json();
    toast(d.message || 'Booking updated');
    loadBookings();
  } catch { toast('Failed to update booking', 'error'); }
}

function deleteBooking() {
  const id = document.getElementById('bd-id').value.trim();
  if (!id) { toast('Enter a Booking ID', 'warn'); return; }
  confirmDelete(
    `Booking ${id}`,
    `The linked payment record for booking <strong>${id}</strong> will also be automatically removed.`,
    async () => {
      try {
        const r = await fetch(`${API}/bookings/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'Booking deleted');
        document.getElementById('bd-id').value = '';
        loadBookings();
      } catch { toast('Failed to delete booking', 'error'); }
    }
  );
}

/* ================================================================
   PAYMENTS
   Routes: GET /payments  POST /payments  PUT /payments/:id  DELETE /payments/:id
   Update: Amount, Payment_Method, Payment_Status  (not Payment_ID or Booking_ID)
   Delete: simple, no children
================================================================ */
async function insertPayment() {
  const id      = document.getElementById('p-id').value.trim();
  const amount  = document.getElementById('p-amount').value;
  const method  = document.getElementById('p-method').value;
  const status  = document.getElementById('p-status').value;
  const booking = document.getElementById('p-booking').value.trim();
  if (!id || !amount || !booking) { toast('Payment ID, Amount and Booking ID are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, amount, method, status, booking })
    });
    const d = await r.json();
    toast(d.message || 'Payment recorded');
    ['p-id','p-amount','p-booking'].forEach(x => document.getElementById(x).value = '');
    loadPayments();
  } catch { toast('Failed to insert payment', 'error'); }
}

async function loadPayments() {
  try {
    const r = await fetch(`${API}/payments`);
    renderTable('body-payments', await r.json());
  } catch { toast('Failed to load payments', 'error'); }
}

async function updatePayment() {
  const id     = document.getElementById('pu-id').value.trim();
  const amount = document.getElementById('pu-amount').value;
  const method = document.getElementById('pu-method').value;
  const status = document.getElementById('pu-status').value;
  if (!id) { toast('Enter the Payment ID to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/payments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method, status })
    });
    const d = await r.json();
    toast(d.message || 'Payment updated');
    loadPayments();
  } catch { toast('Failed to update payment', 'error'); }
}

function deletePayment() {
  const id = document.getElementById('pd-id').value.trim();
  if (!id) { toast('Enter a Payment ID', 'warn'); return; }
  confirmDelete(
    `Payment ${id}`,
    `Payment record <strong>${id}</strong> will be permanently deleted. The associated booking will remain.`,
    async () => {
      try {
        const r = await fetch(`${API}/payments/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'Payment deleted');
        document.getElementById('pd-id').value = '';
        loadPayments();
      } catch { toast('Failed to delete payment', 'error'); }
    }
  );
}

/* ================================================================
   STAFF
   Routes: GET /staff  POST /staff  PUT /staff/:id  DELETE /staff/:id
   Update: Staff_Name, Role  (not Staff_ID or Court_ID which is FK)
   Delete: cascades staff_contact → staff
================================================================ */
async function insertStaff() {
  const id    = document.getElementById('st-id').value.trim();
  const name  = document.getElementById('st-name').value.trim();
  const role  = document.getElementById('st-role').value.trim();
  const court = document.getElementById('st-court').value.trim();
  if (!id || !name) { toast('Staff ID and Name are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, role, court })
    });
    const d = await r.json();
    toast(d.message || 'Staff inserted');
    ['st-id','st-name','st-role','st-court'].forEach(x => document.getElementById(x).value = '');
    loadStaff();
  } catch { toast('Failed to insert staff', 'error'); }
}

async function loadStaff() {
  try {
    const r = await fetch(`${API}/display/staff`);
    renderTable('body-staff', await r.json());
  } catch { toast('Failed to load staff', 'error'); }
}

async function updateStaff() {
  const id   = document.getElementById('stu-id').value.trim();
  const name = document.getElementById('stu-name').value.trim();
  const role = document.getElementById('stu-role').value.trim();
  if (!id) { toast('Enter the Staff ID to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role })
    });
    const d = await r.json();
    toast(d.message || 'Staff updated');
    loadStaff();
  } catch { toast('Failed to update staff', 'error'); }
}

function deleteStaff() {
  const id = document.getElementById('std-id').value.trim();
  if (!id) { toast('Enter a Staff ID', 'warn'); return; }
  confirmDelete(
    `Staff ${id}`,
    `All contact numbers for staff member <strong>${id}</strong> will also be removed.`,
    async () => {
      try {
        const r = await fetch(`${API}/staff/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'Staff deleted');
        document.getElementById('std-id').value = '';
        loadStaff();
      } catch { toast('Failed to delete staff', 'error'); }
    }
  );
}

/* ================================================================
   FEEDBACK
   Routes: GET /feedback  POST /feedback  PUT /feedback/:id  DELETE /feedback/:id
   Update: Rating, Comments  (not Feedback_ID or User_ID)
   Delete: simple, no children
================================================================ */
async function insertFeedback() {
  const id       = document.getElementById('f-id').value.trim();
  const user     = document.getElementById('f-user').value.trim();
  const rating   = document.getElementById('f-rating').value;
  const comments = document.getElementById('f-comments').value.trim();
  if (!id || !user || !rating) { toast('Feedback ID, User ID and Rating are required', 'warn'); return; }
  try {
    const r = await fetch(`${API}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, user, rating: parseInt(rating), comments })
    });
    const d = await r.json();
    toast(d.message || 'Feedback submitted');
    ['f-id','f-user','f-rating','f-comments'].forEach(x => document.getElementById(x).value = '');
    loadFeedback();
  } catch { toast('Failed to insert feedback', 'error'); }
}

async function loadFeedback() {
  try {
    const r = await fetch(`${API}/feedback`);
    renderTable('body-feedback', await r.json());
  } catch { toast('Failed to load feedback', 'error'); }
}

async function updateFeedback() {
  const id       = document.getElementById('fu-id').value.trim();
  const rating   = document.getElementById('fu-rating').value;
  const comments = document.getElementById('fu-comments').value.trim();
  if (!id) { toast('Enter the Feedback ID to update', 'warn'); return; }
  try {
    const r = await fetch(`${API}/feedback/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: parseInt(rating), comments })
    });
    const d = await r.json();
    toast(d.message || 'Feedback updated');
    loadFeedback();
  } catch { toast('Failed to update feedback', 'error'); }
}

function deleteFeedback() {
  const id = document.getElementById('fd-id').value.trim();
  if (!id) { toast('Enter a Feedback ID', 'warn'); return; }
  confirmDelete(
    `Feedback ${id}`,
    `Feedback record <strong>${id}</strong> will be permanently deleted.`,
    async () => {
      try {
        const r = await fetch(`${API}/feedback/${id}`, { method: 'DELETE' });
        const d = await r.json();
        toast(d.message || 'Feedback deleted');
        document.getElementById('fd-id').value = '';
        loadFeedback();
      } catch { toast('Failed to delete feedback', 'error'); }
    }
  );
}

/* ----------------------------------------------------------------
   INIT
---------------------------------------------------------------- */
loadStats();
