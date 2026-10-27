/**
 * ==============================================================================
 * CAMPUSCONNECT - REGISTRATION, PASS CONFIRMATION & TICKETING (registration.js)
 * ==============================================================================
 * University Viva & Technical Explanation:
 * - Role: Orchestrates the student registration pipeline, client-side regex validation,
 *   duplicate registration mitigation, QR code ticket generation, and seat cancellation.
 * - Form Validation: Enforces strict input validation before form submission:
 *     * Registration Number: Exactly 8 numerical digits (/^\d{8}$/)
 *     * Phone Number: Exactly 10 numerical digits (/^\d{10}$/)
 *     * Email: Valid RFC compliant email syntax (/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
 * - Concurrency & Duplicate Prevention: registerStudent() checks if the student has already
 *   booked for this event and recalculates seat capacity immediately prior to writing to localStorage.
 * - Dynamic QR Code Rendering: Uses QRCode.js (CDN) to generate a high-contrast 2D barcode
 *   storing ticket verification JSON data.
 * ==============================================================================
 */

/**
 * ==============================================================================
 * 1. REGISTRATION FORM CONTROLLER (register.html)
 * ==============================================================================
 */
function initRegistrationPage() {
  const form = document.getElementById('event-registration-form');
  const eventSummaryBox = document.getElementById('reg-event-summary');
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    showFatalError('Missing Event Parameter', 'Please select an event from the events catalog to register.');
    return;
  }

  const event = getEventById(eventId);
  if (!event) {
    showFatalError('Event Not Found', `No campus event found matching ID "${eventId}".`);
    return;
  }

  // Check seat capacity and deadlines
  const seatsLeft = getSeatsLeft(event);
  const isFull = isEventFull(event);
  const isExpired = isEventDeadlinePassed(event);

  // Render Event Summary Banner on the form page
  if (eventSummaryBox) {
    eventSummaryBox.innerHTML = `
      <div style="display: flex; gap: 1.25rem; align-items: center;">
        <div style="width: 72px; height: 72px; border-radius: var(--radius-md); overflow: hidden; flex-shrink: 0; background: var(--primary-light);">
          <img src="${escapeHtml(event.bannerUrl || '')}" alt="${escapeHtml(event.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
        </div>
        <div style="flex: 1;">
          <div style="margin-bottom: 0.25rem;">
            ${getCategoryBadge(event.category)}
            <span style="font-size: 0.82rem; color: var(--text-muted); margin-left: 0.5rem;">
              📅 ${formatDate(event.date)} • ⏰ ${escapeHtml(event.time)}
            </span>
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-main); font-family: var(--font-heading);">
            ${escapeHtml(event.title)}
          </h2>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
            📍 ${escapeHtml(event.venue)}
          </div>
        </div>
      </div>
      <div style="margin-top: 1rem;">
        ${renderSeatProgressBar(seatsLeft, event.seatLimit)}
      </div>
    `;
  }

  // If full or closed, block form inputs
  if (isFull || isExpired) {
    const errorNotice = document.createElement('div');
    errorNotice.style.cssText = 'background: #FEE2E2; color: #991B1B; padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; border: 1px solid #F87171;';
    errorNotice.innerHTML = isExpired 
      ? '⚠️ Registration Closed: The deadline for this event has elapsed. New registrations are no longer accepted.'
      : '⚠️ Event Capacity Reached: All seats for this event are currently booked. Please check back later or register for other campus events.';
    form.parentNode.insertBefore(errorNotice, form);
    
    // Disable all fields and submit button
    const elements = form.elements;
    for (let i = 0; i < elements.length; i++) {
      elements[i].disabled = true;
    }
    return;
  }

  // Pre-fill student info if logged in
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (currentUser) {
    if (form.elements['studentName'] && currentUser.name) form.elements['studentName'].value = currentUser.name;
    if (form.elements['email'] && currentUser.email) form.elements['email'].value = currentUser.email;
    if (form.elements['regNumber'] && currentUser.regNumber) form.elements['regNumber'].value = currentUser.regNumber;
    if (form.elements['phone'] && currentUser.phone) form.elements['phone'].value = currentUser.phone;
    if (form.elements['department'] && currentUser.department) form.elements['department'].value = currentUser.department;
    if (form.elements['year'] && currentUser.year) form.elements['year'].value = currentUser.year;
  }

  // Inline Validation Helpers
  const validators = {
    studentName: (val) => val.trim().length >= 3 || 'Name must be at least 3 characters long',
    regNumber: (val) => /^\d{8}$/.test(val.trim()) || 'Registration number must be exactly 8 digits (e.g. 20241088)',
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) || 'Please enter a valid academic email address',
    phone: (val) => /^\d{10}$/.test(val.trim().replace(/\D/g, '')) || 'Phone number must be exactly 10 digits',
    department: (val) => Boolean(val && val.trim()) || 'Please select your academic department',
    year: (val) => Boolean(val && val.trim()) || 'Please select your year of study'
  };

  // Attach live input listeners to clear errors on typing
  Object.keys(validators).forEach(fieldName => {
    const input = form.elements[fieldName];
    if (input) {
      input.addEventListener('input', () => {
        validateField(input, validators[fieldName]);
      });
      input.addEventListener('blur', () => {
        validateField(input, validators[fieldName]);
      });
    }
  });

  function validateField(inputEl, ruleFn) {
    const errorMsgEl = inputEl.parentElement.querySelector('.form-error-msg');
    const result = ruleFn(inputEl.value);

    if (result !== true) {
      inputEl.classList.add('is-invalid');
      if (errorMsgEl) {
        errorMsgEl.textContent = result;
        errorMsgEl.style.display = 'flex';
      }
      return false;
    } else {
      inputEl.classList.remove('is-invalid');
      if (errorMsgEl) {
        errorMsgEl.textContent = '';
        errorMsgEl.style.display = 'none';
      }
      return true;
    }
  }

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isFormValid = true;
    Object.keys(validators).forEach(fieldName => {
      const input = form.elements[fieldName];
      if (input) {
        const valid = validateField(input, validators[fieldName]);
        if (!valid && isFormValid) {
          isFormValid = false;
          input.focus();
        }
      }
    });

    if (!isFormValid) {
      showToast('Please correct the highlighted form errors before submitting.', 'error');
      return;
    }

    // Prepare Registration Payload
    const studentData = {
      eventId: event.id,
      studentName: form.elements['studentName'].value,
      regNumber: form.elements['regNumber'].value,
      email: form.elements['email'].value,
      phone: form.elements['phone'].value,
      department: form.elements['department'].value,
      year: form.elements['year'].value
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Securing Your Seat...';
    }

    // Call atomic registration helper
    setTimeout(() => {
      const outcome = registerStudent(studentData);

      if (!outcome.success) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Confirm Registration';
        }
        showToast(outcome.message, 'error', 6000);
        return;
      }

      // Success: redirect to confirmation slip
      showToast('Seat booked successfully! Generating admit pass...', 'success');
      setTimeout(() => {
        window.location.href = `confirmation.html?regId=${encodeURIComponent(outcome.regId)}`;
      }, 500);
    }, 300);
  });

  function showFatalError(title, desc) {
    if (eventSummaryBox) {
      eventSummaryBox.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(desc)}</p>
          <a href="events.html" class="btn btn-primary" style="margin-top: 1rem;">Back to Events</a>
        </div>
      `;
    }
    if (form) form.style.display = 'none';
  }
}

/**
 * ==============================================================================
 * 2. CONFIRMATION SLIP & TICKET PASS (confirmation.html)
 * ==============================================================================
 */
function initConfirmationPage() {
  const root = document.getElementById('confirmation-ticket-root');
  if (!root) return;

  const urlParams = new URLSearchParams(window.location.search);
  const regId = urlParams.get('regId');

  if (!regId) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❓</div>
        <h3>No Ticket ID Found</h3>
        <p>Please provide a valid ticket registration ID to inspect your pass.</p>
        <a href="my-registrations.html" class="btn btn-primary" style="margin-top: 1rem;">View My Registrations</a>
      </div>
    `;
    return;
  }

  const reg = getRegistrationById(regId);
  if (!reg) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Registration Not Found</h3>
        <p>No valid registration was found for ID: <code>${escapeHtml(regId)}</code></p>
        <a href="events.html" class="btn btn-primary" style="margin-top: 1rem;">Browse Events</a>
      </div>
    `;
    return;
  }

  const isCancelled = reg.status === 'cancelled';

  root.innerHTML = `
    <div class="ticket-wrapper">
      <div class="ticket-card" id="printable-admit-card">
        <!-- Ticket Header -->
        <div class="ticket-header" style="${isCancelled ? 'background: #991B1B;' : ''}">
          <div>
            <div style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.85;">
              Official University Admit Pass
            </div>
            <h2 style="font-size: 1.5rem; font-family: var(--font-heading); font-weight: 700; margin-top: 0.2rem;">
              Campus<span style="color: var(--accent);">Connect</span>
            </h2>
          </div>
          <div>
            ${isCancelled 
              ? `<span class="badge badge-cancelled" style="font-size: 0.85rem; padding: 6px 14px;">CANCELLED</span>`
              : `<span class="ticket-badge-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  CONFIRMED SEAT
                </span>`
            }
          </div>
        </div>

        <!-- Ticket Body -->
        <div class="ticket-body">
          <!-- Left details grid -->
          <div>
            <div style="margin-bottom: 1.25rem;">
              <div class="ticket-meta-label">Event</div>
              <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main); font-family: var(--font-heading);">
                ${escapeHtml(reg.eventTitle)}
              </h3>
            </div>

            <div class="ticket-details-grid">
              <div>
                <div class="ticket-meta-label">Student Name</div>
                <div class="ticket-meta-val">${escapeHtml(reg.studentName)}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Registration No.</div>
                <div class="ticket-meta-val" style="font-family: monospace;">${escapeHtml(reg.regNumber)}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Department</div>
                <div class="ticket-meta-val">${escapeHtml(reg.department)}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Year of Study</div>
                <div class="ticket-meta-val">${escapeHtml(reg.year)}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Event Date & Time</div>
                <div class="ticket-meta-val">${formatDate(reg.eventDate)} • ${escapeHtml(reg.eventTime || '09:00 AM')}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Venue</div>
                <div class="ticket-meta-val">${escapeHtml(reg.eventVenue || 'Campus Auditorium')}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Student Email</div>
                <div class="ticket-meta-val" style="font-size: 0.85rem;">${escapeHtml(reg.email)}</div>
              </div>
              <div>
                <div class="ticket-meta-label">Booked At</div>
                <div class="ticket-meta-val" style="font-size: 0.85rem;">${new Date(reg.timestamp).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <!-- Right: Perforated Divider & QR Code -->
          <div class="ticket-qr-container">
            <div id="ticket-qrcode"></div>
            <div class="ticket-id-tag">${escapeHtml(reg.id)}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.4rem;">
              Scan at entrance for contactless verification
            </div>
          </div>
        </div>

        <!-- Perforated Notch Visual Divider -->
        <div class="ticket-divider">
          <div class="notch-left"></div>
          <div class="notch-right"></div>
        </div>

        <!-- Ticket Footer & Action Controls -->
        <div class="ticket-footer-actions">
          <div style="display: flex; gap: 0.75rem;">
            <button id="print-slip-btn" class="btn btn-primary btn-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print / Save PDF
            </button>
            <a href="my-registrations.html" class="btn btn-outline btn-sm">
              My Registrations
            </a>
          </div>
          <a href="events.html" class="btn btn-outline btn-sm">
            Browse More Events →
          </a>
        </div>
      </div>
    </div>
  `;

  // Bind Print Trigger
  const printBtn = document.getElementById('print-slip-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Generate QR Code via QRCode.js CDN
  renderQrCode(reg);
}

/**
 * Generates an SVG/Canvas QR Code inside #ticket-qrcode.
 */
function renderQrCode(reg) {
  const qrTarget = document.getElementById('ticket-qrcode');
  if (!qrTarget) return;

  const payload = JSON.stringify({
    passId: reg.id,
    student: reg.studentName,
    regNo: reg.regNumber,
    eventId: reg.eventId,
    valid: reg.status === 'confirmed'
  });

  qrTarget.innerHTML = '';

  // Check if QRCode library is loaded from CDN
  if (typeof QRCode !== 'undefined') {
    new QRCode(qrTarget, {
      text: payload,
      width: 130,
      height: 130,
      colorDark: '#0F172A',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    // Elegant fallback SVG barcode if offline or CDN is delayed
    qrTarget.innerHTML = `
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        <rect width="120" height="120" fill="#F8FAFC" rx="8"/>
        <rect x="15" y="15" width="30" height="30" stroke="#0F172A" stroke-width="3" fill="none"/>
        <rect x="23" y="23" width="14" height="14" fill="#0F172A"/>
        <rect x="75" y="15" width="30" height="30" stroke="#0F172A" stroke-width="3" fill="none"/>
        <rect x="83" y="23" width="14" height="14" fill="#0F172A"/>
        <rect x="15" y="75" width="30" height="30" stroke="#0F172A" stroke-width="3" fill="none"/>
        <rect x="23" y="83" width="14" height="14" fill="#0F172A"/>
        <line x1="55" y1="20" x2="65" y2="20" stroke="#0F172A" stroke-width="3"/>
        <line x1="55" y1="35" x2="65" y2="35" stroke="#0F172A" stroke-width="3"/>
        <line x1="55" y1="50" x2="65" y2="50" stroke="#0F172A" stroke-width="3"/>
        <line x1="55" y1="65" x2="65" y2="65" stroke="#0F172A" stroke-width="3"/>
        <line x1="55" y1="80" x2="105" y2="80" stroke="#0F172A" stroke-width="3"/>
        <line x1="75" y1="95" x2="105" y2="95" stroke="#0F172A" stroke-width="3"/>
      </svg>
    `;
  }
}

/**
 * ==============================================================================
 * 3. MY REGISTRATIONS DASHBOARD (my-registrations.html)
 * ==============================================================================
 */
function initMyRegistrationsPage() {
  const container = document.getElementById('my-registrations-list');
  const searchInput = document.getElementById('student-lookup-input');
  const lookupBtn = document.getElementById('student-lookup-btn');
  const activeStudentDisplay = document.getElementById('active-lookup-student');

  if (!container) return;

  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

  // Determine initial query (either from current student session or URL or empty)
  const urlParams = new URLSearchParams(window.location.search);
  let activeQuery = urlParams.get('q') || (currentUser ? currentUser.email || currentUser.regNumber : '');

  if (searchInput && activeQuery) {
    searchInput.value = activeQuery;
  }

  function renderRegistrationsList() {
    if (!activeQuery) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🎫</div>
          <h3 class="empty-state-title">Track Your Campus Passes</h3>
          <p class="empty-state-desc">
            Enter your 8-digit Student Registration Number or Academic Email above to view your confirmed tickets and admit slips.
          </p>
          ${!currentUser ? `
            <a href="login.html?redirect=my-registrations.html" class="btn btn-primary btn-sm">
              Sign In with Student Account
            </a>
          ` : ''}
        </div>
      `;
      if (activeStudentDisplay) activeStudentDisplay.textContent = '';
      return;
    }

    const regs = getStudentRegistrations(activeQuery);

    if (activeStudentDisplay) {
      activeStudentDisplay.textContent = `Showing passes for: ${activeQuery} (${regs.length} found)`;
    }

    if (regs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3 class="empty-state-title">No Registrations Found</h3>
          <p class="empty-state-desc">
            We couldn't find any event bookings matching "${escapeHtml(activeQuery)}".
          </p>
          <a href="events.html" class="btn btn-primary btn-sm">Browse Events Catalog</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${regs.map(r => {
          const isCancelled = r.status === 'cancelled';
          return `
            <div class="event-card" style="flex-direction: row; align-items: center; padding: 1.25rem; gap: 1.5rem; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 260px;">
                <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem;">
                  <span class="badge ${isCancelled ? 'badge-cancelled' : 'badge-confirmed'}">
                    ${isCancelled ? 'Cancelled' : 'Confirmed'}
                  </span>
                  <span style="font-family: monospace; font-size: 0.8rem; color: var(--text-light);">
                    ${escapeHtml(r.id)}
                  </span>
                </div>
                <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--text-main);">
                  ${escapeHtml(r.eventTitle)}
                </h3>
                <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 1rem; flex-wrap: wrap;">
                  <span>📅 ${formatDate(r.eventDate)}</span>
                  <span>📍 ${escapeHtml(r.eventVenue || 'Auditorium')}</span>
                  <span>👤 ${escapeHtml(r.studentName)} (${escapeHtml(r.regNumber)})</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;">
                <a href="confirmation.html?regId=${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline-primary">
                  View Slip
                </a>
                ${!isCancelled ? `
                  <button 
                    onclick="promptCancelRegistration('${escapeHtml(r.id)}', '${escapeHtml(r.eventTitle)}')" 
                    class="btn btn-sm btn-outline" 
                    style="color: var(--danger); border-color: #FECACA;"
                  >
                    Cancel Seat
                  </button>
                ` : `
                  <span style="font-size: 0.8rem; color: var(--text-light); font-style: italic;">Seat Released</span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Handle Search Input & Button
  if (lookupBtn && searchInput) {
    lookupBtn.addEventListener('click', () => {
      activeQuery = searchInput.value.trim();
      renderRegistrationsList();
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        activeQuery = searchInput.value.trim();
        renderRegistrationsList();
      }
    });
  }

  // Global cancel prompt
  window.promptCancelRegistration = function(regId, title) {
    showConfirmModal({
      title: 'Cancel Registration?',
      message: `Are you sure you want to cancel your pass for "${title}"? Your seat will be immediately released and returned to the university pool for other students.`,
      confirmText: 'Yes, Cancel Seat',
      cancelText: 'Keep My Ticket',
      isDestructive: true,
      onConfirm: () => {
        const res = cancelRegistration(regId);
        if (res.success) {
          showToast(res.message, 'info');
          renderRegistrationsList();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  };

  // Initial list render
  renderRegistrationsList();
}
