/**
 * ==============================================================================
 * CAMPUSCONNECT - ADMIN DASHBOARD, EVENT CRUD & PARTICIPANTS (dashboard.js)
 * ==============================================================================
 * University Viva & Technical Explanation:
 * - Role: Drives the administrative back-office: metric computation, Chart.js visualizations,
 *   event authoring (with real-time live preview), seat limit constraints, and CSV attendee export.
 * - Route Security: Calls requireAdmin() at execution start to ensure unauthorized visitors
 *   cannot manipulate events or view attendee records.
 * - Chart.js Lifecycle: Maintains global chart references (window.chartRegs, window.chartCats)
 *   and explicitly calls .destroy() before re-rendering to prevent canvas memory leaks.
 * - CSV Generation: Builds an RFC-4180 compliant CSV string client-side and triggers a download
 *   using Blob and URL.createObjectURL() without needing a backend server.
 * ==============================================================================
 */

/**
 * ==============================================================================
 * 1. ADMIN OVERVIEW DASHBOARD (dashboard.html)
 * ==============================================================================
 */
function initAdminDashboard() {
  if (typeof requireAdmin === 'function') requireAdmin();

  const events = getEvents();
  const regs = getRegistrations();
  const activeRegs = regs.filter(r => r.status === 'confirmed');

  // Compute Summary Statistics
  const totalEvents = events.length;
  const totalRegistrations = activeRegs.length;

  const totalCapacity = events.reduce((acc, curr) => acc + (curr.seatLimit || 0), 0);
  const seatsFilledPercent = totalCapacity > 0 
    ? Math.round((totalRegistrations / totalCapacity) * 100) 
    : 0;

  const now = new Date();
  const upcomingCount = events.filter(e => new Date(e.date) >= new Date(now.setHours(0,0,0,0))).length;

  // Render Metric Cards
  setElementText('stat-total-events', totalEvents);
  setElementText('stat-total-regs', totalRegistrations);
  setElementText('stat-seats-percent', `${seatsFilledPercent}%`);
  setElementText('stat-upcoming-events', upcomingCount);

  // Render Chart.js Visualizations
  renderDashboardCharts(events, activeRegs);

  // Render Recent Activity / Events Table
  renderRecentEventsTable(events);
}

/**
 * Helper to update element text safely.
 */
function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Renders Bar Chart (Registrations per Event) and Doughnut Chart (Category Distribution).
 */
function renderDashboardCharts(events, activeRegs) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js CDN is not loaded.');
    return;
  }

  // 1. Data for Bar Chart: Registrations Per Event
  const barLabels = events.map(e => e.title.length > 20 ? e.title.substring(0, 18) + '...' : e.title);
  const barData = events.map(e => {
    return activeRegs.filter(r => r.eventId === e.id).length;
  });
  const barCapacity = events.map(e => e.seatLimit);

  const barCanvas = document.getElementById('chart-registrations-bar');
  if (barCanvas) {
    if (window.myBarChart) window.myBarChart.destroy();

    const ctx = barCanvas.getContext('2d');
    window.myBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: barLabels,
        datasets: [
          {
            label: 'Confirmed Registrations',
            data: barData,
            backgroundColor: '#4F46E5',
            borderRadius: 6
          },
          {
            label: 'Total Seat Capacity',
            data: barCapacity,
            backgroundColor: '#E2E8F0',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } },
          tooltip: {
            padding: 10,
            cornerRadius: 8,
            titleFont: { family: 'Inter', size: 13, weight: 'bold' }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#F1F5F9' } }
        }
      }
    });
  }

  // 2. Data for Doughnut Chart: Events by Category
  const categoryCounts = {};
  events.forEach(e => {
    const cat = e.category || 'Other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const donutLabels = Object.keys(categoryCounts);
  const donutData = Object.values(categoryCounts);
  const donutColors = ['#4F46E5', '#F97316', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const donutCanvas = document.getElementById('chart-category-donut');
  if (donutCanvas) {
    if (window.myDonutChart) window.myDonutChart.destroy();

    const ctx = donutCanvas.getContext('2d');
    window.myDonutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: donutLabels,
        datasets: [{
          data: donutData,
          backgroundColor: donutColors,
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } }
        }
      }
    });
  }
}

/**
 * Renders the recent events overview table on the admin dashboard.
 */
function renderRecentEventsTable(events) {
  const tableBody = document.getElementById('admin-recent-events-tbody');
  if (!tableBody) return;

  if (events.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No events available.</td></tr>`;
    return;
  }

  tableBody.innerHTML = events.slice(0, 8).map(e => {
    const seatsLeft = getSeatsLeft(e);
    const booked = e.seatLimit - seatsLeft;
    const isFull = isEventFull(e);

    return `
      <tr>
        <td>
          <strong style="color: var(--text-main);">${escapeHtml(e.title)}</strong>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(e.venue)}</div>
        </td>
        <td>${getCategoryBadge(e.category)}</td>
        <td>${formatDate(e.date)}</td>
        <td>
          <div style="font-weight: 600;">${booked} / ${e.seatLimit}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${seatsLeft} remaining</div>
        </td>
        <td>
          ${isFull 
            ? `<span class="badge badge-full">Full</span>`
            : isEventDeadlinePassed(e)
            ? `<span class="badge badge-cancelled">Closed</span>`
            : `<span class="badge badge-open">Active</span>`}
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <a href="manage-events.html?edit=${encodeURIComponent(e.id)}" class="btn btn-sm btn-outline" title="Edit Event">
              Edit
            </a>
            <a href="participants.html?eventId=${encodeURIComponent(e.id)}" class="btn btn-sm btn-outline-primary" title="View Registered Attendees">
              Attendees (${booked})
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * ==============================================================================
 * 2. MANAGE EVENTS CONTROLLER (manage-events.html)
 * ==============================================================================
 */
function initManageEventsPage() {
  if (typeof requireAdmin === 'function') requireAdmin();

  const form = document.getElementById('manage-event-form');
  const previewContainer = document.getElementById('event-live-preview-target');
  const eventsTableBody = document.getElementById('manage-events-table-body');
  const formHeading = document.getElementById('manage-form-heading');
  const submitBtn = document.getElementById('manage-submit-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  let currentEditingEvent = editId ? getEventById(editId) : null;

  // Set form mode if editing
  if (currentEditingEvent) {
    if (formHeading) formHeading.textContent = `Edit Event: ${currentEditingEvent.title}`;
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';

    // Populate fields
    form.elements['id'].value = currentEditingEvent.id;
    form.elements['title'].value = currentEditingEvent.title;
    form.elements['category'].value = currentEditingEvent.category;
    form.elements['date'].value = currentEditingEvent.date;
    form.elements['time'].value = currentEditingEvent.time;
    form.elements['venue'].value = currentEditingEvent.venue;
    form.elements['seatLimit'].value = currentEditingEvent.seatLimit;
    form.elements['deadline'].value = currentEditingEvent.deadline ? currentEditingEvent.deadline.slice(0, 16) : '';
    form.elements['bannerUrl'].value = currentEditingEvent.bannerUrl || '';
    form.elements['eligibility'].value = currentEditingEvent.eligibility || '';
    form.elements['organizer'].value = currentEditingEvent.organizer || '';
    form.elements['description'].value = currentEditingEvent.description;
  }

  // Update Live Preview dynamically as user edits form inputs
  function updateLivePreview() {
    if (!previewContainer) return;

    const previewData = {
      id: form.elements['id'].value || 'evt-preview',
      title: form.elements['title'].value || 'Event Title Preview',
      category: form.elements['category'].value || 'Fest',
      date: form.elements['date'].value || '2026-11-20',
      time: form.elements['time'].value || '10:00 AM - 04:00 PM',
      venue: form.elements['venue'].value || 'Campus Auditorium',
      seatLimit: parseInt(form.elements['seatLimit'].value, 10) || 50,
      bannerUrl: form.elements['bannerUrl'].value || SAMPLE_BANNERS.techfest,
      description: form.elements['description'].value || 'Enter an engaging description for your event to see it previewed here.'
    };

    // Calculate booked seats if editing
    const currentBooked = currentEditingEvent ? getConfirmedRegistrationsCount(currentEditingEvent.id) : 0;
    const remaining = Math.max(0, previewData.seatLimit - currentBooked);

    previewContainer.innerHTML = `
      <div style="font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-light); margin-bottom: 0.75rem;">
        Live Card Preview
      </div>
      <div class="event-card" style="box-shadow: var(--shadow-md);">
        <div class="event-card-banner">
          <img src="${escapeHtml(previewData.bannerUrl)}" alt="Preview" onerror="this.onerror=null; this.src='${SAMPLE_BANNERS.techfest}';">
          <div class="event-card-category-overlay">${getCategoryBadge(previewData.category)}</div>
        </div>
        <div class="event-card-body">
          <div class="event-card-meta">
            <span>📅 ${formatDate(previewData.date)}</span>
            <span>📍 ${escapeHtml(previewData.venue.split(',')[0])}</span>
          </div>
          <h3 class="event-card-title">${escapeHtml(previewData.title)}</h3>
          <p class="event-card-desc">${escapeHtml(previewData.description)}</p>
          ${renderSeatProgressBar(remaining, previewData.seatLimit)}
        </div>
      </div>
    `;
  }

  // Bind live preview listeners
  const watchedInputs = ['title', 'category', 'date', 'venue', 'seatLimit', 'bannerUrl', 'description'];
  watchedInputs.forEach(name => {
    if (form.elements[name]) {
      form.elements[name].addEventListener('input', updateLivePreview);
      form.elements[name].addEventListener('change', updateLivePreview);
    }
  });
  updateLivePreview();

  // Cancel edit handler
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
      window.location.href = 'manage-events.html';
    });
  }

  // Handle Form Submission (Create or Edit)
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = form.elements['title'].value.trim();
    const category = form.elements['category'].value;
    const date = form.elements['date'].value;
    const time = form.elements['time'].value.trim();
    const venue = form.elements['venue'].value.trim();
    const seatLimit = parseInt(form.elements['seatLimit'].value, 10);
    const deadline = form.elements['deadline'].value;
    const bannerUrl = form.elements['bannerUrl'].value.trim() || SAMPLE_BANNERS.techfest;
    const eligibility = form.elements['eligibility'].value.trim();
    const organizer = form.elements['organizer'].value.trim() || 'University Events Cell';
    const description = form.elements['description'].value.trim();

    if (!title || !date || !time || !venue || isNaN(seatLimit) || seatLimit < 1 || !deadline || !description) {
      showToast('Please fill in all required event details.', 'error');
      return;
    }

    const payload = {
      id: form.elements['id'].value || `evt-${Date.now()}`,
      title,
      category,
      date,
      time,
      venue,
      seatLimit,
      deadline,
      bannerUrl,
      eligibility,
      organizer,
      description
    };

    const res = saveOrUpdateEvent(payload);

    if (!res.success) {
      showToast(res.message, 'error', 6000);
      return;
    }

    showToast(res.message, 'success');
    setTimeout(() => {
      window.location.href = 'manage-events.html';
    }, 600);
  });

  // Render Existing Events Table
  function renderAllEventsTable() {
    if (!eventsTableBody) return;
    const events = getEvents();

    if (events.length === 0) {
      eventsTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No events registered yet.</td></tr>`;
      return;
    }

    eventsTableBody.innerHTML = events.map(e => {
      const booked = getConfirmedRegistrationsCount(e.id);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(e.title)}</strong>
            <div style="font-size: 0.75rem; color: var(--text-light);">${escapeHtml(e.id)}</div>
          </td>
          <td>${getCategoryBadge(e.category)}</td>
          <td>${formatDate(e.date)}</td>
          <td>${booked} / ${e.seatLimit}</td>
          <td>
            ${isEventFull(e) ? `<span class="badge badge-full">Full</span>` : `<span class="badge badge-open">Open</span>`}
          </td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <a href="manage-events.html?edit=${encodeURIComponent(e.id)}" class="btn btn-sm btn-outline">Edit</a>
              <button 
                onclick="promptDeleteEvent('${escapeHtml(e.id)}', '${escapeHtml(e.title)}')" 
                class="btn btn-sm btn-outline" 
                style="color: var(--danger); border-color: #FECACA;"
              >
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.promptDeleteEvent = function(id, title) {
    showConfirmModal({
      title: 'Delete Event?',
      message: `Are you sure you want to delete "${title}"? This will permanently remove the event from the student portal.`,
      confirmText: 'Delete Event',
      isDestructive: true,
      onConfirm: () => {
        const res = deleteEvent(id);
        if (res.success) {
          showToast(res.message, 'info');
          renderAllEventsTable();
          updateLivePreview();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  };

  renderAllEventsTable();
}

/**
 * ==============================================================================
 * 3. PARTICIPANTS DIRECTORY & CSV EXPORT (participants.html)
 * ==============================================================================
 */
function initParticipantsPage() {
  if (typeof requireAdmin === 'function') requireAdmin();

  const eventFilterSelect = document.getElementById('participant-event-filter');
  const searchInput = document.getElementById('participant-search-input');
  const tableBody = document.getElementById('participants-table-body');
  const exportBtn = document.getElementById('export-csv-btn');
  const countBadge = document.getElementById('participant-count-badge');

  if (!tableBody) return;

  const events = getEvents();

  // Populate event dropdown
  if (eventFilterSelect) {
    const urlParams = new URLSearchParams(window.location.search);
    const initialEventId = urlParams.get('eventId') || 'all';

    eventFilterSelect.innerHTML = `
      <option value="all">All Events (${events.length})</option>
      ${events.map(e => `
        <option value="${escapeHtml(e.id)}" ${e.id === initialEventId ? 'selected' : ''}>
          ${escapeHtml(e.title)}
        </option>
      `).join('')}
    `;
  }

  function getFilteredRegistrations() {
    let regs = getRegistrations();
    const selectedEvent = eventFilterSelect ? eventFilterSelect.value : 'all';
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (selectedEvent !== 'all') {
      regs = regs.filter(r => r.eventId === selectedEvent);
    }

    if (term) {
      regs = regs.filter(r =>
        r.studentName.toLowerCase().includes(term) ||
        r.regNumber.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term) ||
        (r.department && r.department.toLowerCase().includes(term)) ||
        (r.eventTitle && r.eventTitle.toLowerCase().includes(term))
      );
    }

    return regs;
  }

  function renderParticipantsTable() {
    const list = getFilteredRegistrations();

    if (countBadge) {
      countBadge.textContent = `${list.length} Attendee${list.length === 1 ? '' : 's'}`;
    }

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No participants found matching the current search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map(r => {
      const isConfirmed = r.status === 'confirmed';
      return `
        <tr>
          <td>
            <a href="confirmation.html?regId=${encodeURIComponent(r.id)}" style="font-family: monospace; font-weight: 600; color: var(--primary);">
              ${escapeHtml(r.id)}
            </a>
          </td>
          <td>
            <strong>${escapeHtml(r.studentName)}</strong>
          </td>
          <td><code>${escapeHtml(r.regNumber)}</code></td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.phone || '-')}</td>
          <td>${escapeHtml(r.department)} (${escapeHtml(r.year)})</td>
          <td>${escapeHtml(r.eventTitle)}</td>
          <td>
            <span class="badge ${isConfirmed ? 'badge-confirmed' : 'badge-cancelled'}">
              ${isConfirmed ? 'Confirmed' : 'Cancelled'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Bind Listeners
  if (eventFilterSelect) eventFilterSelect.addEventListener('change', renderParticipantsTable);
  if (searchInput) searchInput.addEventListener('input', renderParticipantsTable);

  // CSV Export Trigger
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataToExport = getFilteredRegistrations();

      if (dataToExport.length === 0) {
        showToast('No participant records to export.', 'warning');
        return;
      }

      const headers = ['Registration ID', 'Event Name', 'Student Name', 'Registration Number', 'Email', 'Phone', 'Department', 'Year', 'Status', 'Registered At'];

      const csvRows = [headers.join(',')];

      dataToExport.forEach(r => {
        const row = [
          `"${r.id}"`,
          `"${(r.eventTitle || '').replace(/"/g, '""')}"`,
          `"${(r.studentName || '').replace(/"/g, '""')}"`,
          `"${r.regNumber}"`,
          `"${r.email}"`,
          `"${r.phone || ''}"`,
          `"${(r.department || '').replace(/"/g, '""')}"`,
          `"${r.year || ''}"`,
          `"${r.status}"`,
          `"${r.timestamp}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      const timestamp = new Date().toISOString().slice(0, 10);
      tempLink.setAttribute('download', `campusconnect_participants_${timestamp}.csv`);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Exported ${dataToExport.length} attendees to CSV file!`, 'success');
    });
  }

  // Initial table render
  renderParticipantsTable();
}
