/**
 * ==============================================================================
 * CAMPUSCONNECT - EVENT CATALOG & DETAILS CONTROLLER (events.js)
 * ==============================================================================
 * University Viva & Technical Explanation:
 * - Role: Manages event browsing, search filtering, dynamic sorting, and the
 *   comprehensive event details view.
 * - Multi-criteria Filtering: Combines text search, category chips, date horizons,
 *   and seat availability simultaneously using functional programming (Array.prototype.filter).
 * - URL Parameter Integration: Reads and writes URL query parameters via the standard
 *   URLSearchParams Web API (e.g., ?category=Workshop, ?id=evt-101), enabling shareable,
 *   bookmarkable links without a server framework.
 * - Dynamic Countdown Timer: Computes remaining time until the registration deadline
 *   and updates the UI in real-time.
 * ==============================================================================
 */

/**
 * Generates the HTML markup for an event card in the catalog grid.
 * @param {Object} event - Event record
 * @returns {string} HTML markup
 */
function renderEventCard(event) {
  const seatsLeft = getSeatsLeft(event);
  const isFull = isEventFull(event);
  const isExpired = isEventDeadlinePassed(event);

  // Status button decision
  let actionButtonHtml = '';
  if (isExpired) {
    actionButtonHtml = `<button class="btn btn-sm btn-outline" disabled style="opacity: 0.6;">Closed</button>`;
  } else if (isFull) {
    actionButtonHtml = `<button class="btn btn-sm btn-outline" disabled style="color: var(--danger); border-color: var(--danger); opacity: 0.7;">Event Full</button>`;
  } else {
    actionButtonHtml = `<a href="register.html?id=${encodeURIComponent(event.id)}" class="btn btn-sm btn-primary">Register</a>`;
  }

  // Fallback image gradient in case image fails to load
  const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'><rect width='100%' height='100%' fill='%234F46E5'/><text x='50%' y='50%' fill='%23FFFFFF' font-size='20' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>CampusConnect</text></svg>";

  return `
    <article class="event-card" id="card-${event.id}">
      <div class="event-card-banner">
        <img 
          src="${escapeHtml(event.bannerUrl || '')}" 
          alt="${escapeHtml(event.title)}" 
          loading="lazy"
          onerror="this.onerror=null; this.src='${fallbackSvg}';"
        >
        <div class="event-card-category-overlay">
          ${getCategoryBadge(event.category)}
        </div>
        <div class="event-card-status-overlay">
          ${isExpired ? `<span class="badge badge-cancelled">Deadline Passed</span>` : isFull ? `<span class="badge badge-full">FULL</span>` : ''}
        </div>
      </div>

      <div class="event-card-body">
        <div class="event-card-meta">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${formatDate(event.date)}
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(event.venue.split(',')[0])}
            </span>
          </span>
        </div>

        <h3 class="event-card-title">
          <a href="event-details.html?id=${encodeURIComponent(event.id)}" title="${escapeHtml(event.title)}">
            ${escapeHtml(event.title)}
          </a>
        </h3>

        <p class="event-card-desc">
          ${escapeHtml(event.description)}
        </p>

        <!-- Live Seat Counter with Progress Bar -->
        ${renderSeatProgressBar(seatsLeft, event.seatLimit)}

        <div class="event-card-footer">
          <a href="event-details.html?id=${encodeURIComponent(event.id)}" class="btn btn-sm btn-outline">
            View Details
          </a>
          ${actionButtonHtml}
        </div>
      </div>
    </article>
  `;
}

/**
 * Initializes the Events Catalog Page (events.html).
 * Handles search, filters, category chips, sorting, and URL sync.
 */
function initEventsCatalog() {
  const container = document.getElementById('events-catalog-grid');
  const countDisplay = document.getElementById('events-count-display');
  const searchInput = document.getElementById('catalog-search-input');
  const categoryChips = document.querySelectorAll('.chip-btn[data-category]');
  const dateFilter = document.getElementById('filter-date');
  const availabilityFilter = document.getElementById('filter-availability');
  const sortSelect = document.getElementById('sort-events');

  if (!container) return;

  // Read initial filter values from URL query string
  const urlParams = new URLSearchParams(window.location.search);
  let activeCategory = urlParams.get('category') || 'all';
  let searchQuery = urlParams.get('search') || '';

  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }

  // Highlight URL category chip if specified
  categoryChips.forEach(chip => {
    const chipCat = chip.getAttribute('data-category');
    if (chipCat.toLowerCase() === activeCategory.toLowerCase()) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  /**
   * Evaluates current filter inputs and re-renders the events grid.
   */
  function applyFiltersAndRender() {
    let events = getEvents();

    // 1. Text Search Filter (Title, Description, Venue)
    const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
    if (term) {
      events = events.filter(e =>
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.venue.toLowerCase().includes(term) ||
        (e.organizer && e.organizer.toLowerCase().includes(term))
      );
    }

    // 2. Category Filter
    if (activeCategory && activeCategory !== 'all') {
      events = events.filter(e => e.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // 3. Availability Filter
    const availVal = availabilityFilter ? availabilityFilter.value : 'all';
    if (availVal === 'available') {
      events = events.filter(e => !isEventFull(e) && !isEventDeadlinePassed(e));
    } else if (availVal === 'full') {
      events = events.filter(e => isEventFull(e));
    }

    // 4. Date Filter
    const dateVal = dateFilter ? dateFilter.value : 'all';
    const now = new Date();
    if (dateVal === 'upcoming') {
      events = events.filter(e => new Date(e.date) >= new Date(now.setHours(0, 0, 0, 0)));
    } else if (dateVal === 'week') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      events = events.filter(e => {
        const d = new Date(e.date);
        return d >= now && d <= nextWeek;
      });
    }

    // 5. Dynamic Sorting
    const sortVal = sortSelect ? sortSelect.value : 'date-asc';
    events.sort((a, b) => {
      if (sortVal === 'date-asc') {
        return new Date(a.date) - new Date(b.date);
      } else if (sortVal === 'date-desc') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortVal === 'seats-desc') {
        return getSeatsLeft(b) - getSeatsLeft(a);
      } else if (sortVal === 'seats-asc') {
        return getSeatsLeft(a) - getSeatsLeft(b);
      } else if (sortVal === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    // Update count display
    if (countDisplay) {
      countDisplay.textContent = `Showing ${events.length} event${events.length === 1 ? '' : 's'}`;
    }

    // Render Grid or Empty State
    if (events.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <h3 class="empty-state-title">No matching events found</h3>
          <p class="empty-state-desc">
            We couldn't find any events matching your selected filters. Try broadening your search or resetting category filters.
          </p>
          <button id="reset-filters-btn" class="btn btn-outline-primary btn-sm">Reset All Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          activeCategory = 'all';
          categoryChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-category') === 'all'));
          if (availabilityFilter) availabilityFilter.value = 'all';
          if (dateFilter) dateFilter.value = 'all';
          if (sortSelect) sortSelect.value = 'date-asc';
          applyFiltersAndRender();
        });
      }
    } else {
      container.innerHTML = events.map(renderEventCard).join('');
    }
  }

  // Event Listeners for Filters
  if (searchInput) {
    searchInput.addEventListener('input', applyFiltersAndRender);
  }

  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-category') || 'all';
      applyFiltersAndRender();
    });
  });

  if (dateFilter) dateFilter.addEventListener('change', applyFiltersAndRender);
  if (availabilityFilter) availabilityFilter.addEventListener('change', applyFiltersAndRender);
  if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndRender);

  // Initial render
  applyFiltersAndRender();
}

/**
 * Initializes the Event Details Page (event-details.html).
 * Loads event by query parameter 'id' and binds interactive elements.
 */
function initEventDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  const detailsRoot = document.getElementById('event-details-root');

  if (!detailsRoot) return;

  if (!eventId) {
    renderNotFound('No event ID was provided in the URL.');
    return;
  }

  const event = getEventById(eventId);
  if (!event) {
    renderNotFound(`Event with ID "${eventId}" was not found.`);
    return;
  }

  // Update Page Title
  document.title = `${event.title} - CampusConnect`;

  const seatsLeft = getSeatsLeft(event);
  const isFull = isEventFull(event);
  const isExpired = isEventDeadlinePassed(event);

  // Fallback image
  const fallbackSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><rect width='100%' height='100%' fill='%234F46E5'/><text x='50%' y='50%' fill='%23FFFFFF' font-size='36' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>CampusConnect</text></svg>";

  // Deadline calculation
  const deadlineDate = new Date(event.deadline);
  const deadlineFormatted = isNaN(deadlineDate) ? event.deadline : deadlineDate.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Action button state
  let ctaButtonHtml = '';
  if (isExpired) {
    ctaButtonHtml = `
      <button class="btn btn-full btn-outline" disabled style="opacity: 0.6; cursor: not-allowed;">
        Registration Closed
      </button>
      <p style="font-size: 0.78rem; color: var(--danger); text-align: center; margin-top: 0.4rem;">
        The registration deadline for this event has elapsed.
      </p>
    `;
  } else if (isFull) {
    ctaButtonHtml = `
      <button class="btn btn-full btn-outline" disabled style="border-color: var(--danger); color: var(--danger); cursor: not-allowed;">
        Event Full (Capacity Reached)
      </button>
      <p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin-top: 0.4rem;">
        Check back later in case an attendee cancels their ticket.
      </p>
    `;
  } else {
    ctaButtonHtml = `
      <a href="register.html?id=${encodeURIComponent(event.id)}" class="btn btn-primary btn-full btn-lg">
        Register Now (${seatsLeft} seats left)
      </a>
    `;
  }

  // Agenda list markup
  const agendaList = event.agenda && event.agenda.length > 0 ? event.agenda : [
    { time: 'TBA', title: 'Program Schedule', desc: 'Detailed schedule will be announced closer to the event date.' }
  ];

  detailsRoot.innerHTML = `
    <!-- Event Banner -->
    <div class="event-details-banner">
      <img 
        src="${escapeHtml(event.bannerUrl || '')}" 
        alt="${escapeHtml(event.title)}" 
        onerror="this.onerror=null; this.src='${fallbackSvg}';"
      >
    </div>

    <div class="event-details-layout">
      <!-- Main Content Left Column -->
      <div class="details-content-card">
        <div class="details-header-meta">
          ${getCategoryBadge(event.category)}
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            Organized by <strong>${escapeHtml(event.organizer || 'University Committee')}</strong>
          </span>
        </div>

        <h1 class="details-title">${escapeHtml(event.title)}</h1>

        <!-- Overview & Description -->
        <h3 class="details-section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          About This Event
        </h3>
        <p style="font-size: 1.05rem; line-height: 1.7; color: #334155; margin-bottom: 2rem;">
          ${escapeHtml(event.description)}
        </p>

        <!-- Eligibility -->
        <h3 class="details-section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          Eligibility & Requirements
        </h3>
        <div style="background: var(--bg-alt); padding: 1.25rem; border-radius: var(--radius-md); border-left: 4px solid var(--primary); margin-bottom: 2rem;">
          <p style="font-size: 0.95rem; color: var(--text-main); font-weight: 500;">
            ${escapeHtml(event.eligibility || 'Open to all bonafide university students with a valid registration number.')}
          </p>
        </div>

        <!-- Agenda Timeline -->
        <h3 class="details-section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Event Schedule & Agenda
        </h3>
        <div class="agenda-timeline">
          ${agendaList.map(item => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-time">${escapeHtml(item.time)}</div>
              <div class="timeline-title">${escapeHtml(item.title)}</div>
              <div class="timeline-desc">${escapeHtml(item.desc)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right Column: Sticky Action Card -->
      <aside class="sticky-sidebar-card">
        <div>
          <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-light); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
            Registration Status
          </div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--text-main); font-family: var(--font-heading);">
            Free Admission
          </div>
        </div>

        <!-- Live Seat Indicator -->
        ${renderSeatProgressBar(seatsLeft, event.seatLimit)}

        <!-- Key Logistics List -->
        <ul class="sidebar-info-list">
          <li class="sidebar-info-item">
            <div class="sidebar-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600;">Date & Time</div>
              <div style="color: var(--text-muted); font-size: 0.85rem;">
                ${formatDate(event.date)} • ${escapeHtml(event.time)}
              </div>
            </div>
          </li>

          <li class="sidebar-info-item">
            <div class="sidebar-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600;">Venue</div>
              <div style="color: var(--text-muted); font-size: 0.85rem;">
                ${escapeHtml(event.venue)}
              </div>
            </div>
          </li>

          <li class="sidebar-info-item">
            <div class="sidebar-info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <div style="font-weight: 600;">Deadline</div>
              <div style="color: var(--text-muted); font-size: 0.85rem;" id="deadline-countdown-display">
                ${deadlineFormatted}
              </div>
            </div>
          </li>
        </ul>

        <!-- Action Button -->
        ${ctaButtonHtml}

        <button id="share-event-btn" class="btn btn-outline btn-full btn-sm" style="margin-top: -0.5rem;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share Event Link
        </button>

        <a href="events.html" style="text-align: center; font-size: 0.85rem; color: var(--text-muted);">
          ← Back to All Events
        </a>
      </aside>
    </div>
  `;

  // Bind Share button
  const shareBtn = document.getElementById('share-event-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast('Event link copied to clipboard!', 'info');
      } else {
        showToast('Shareable link: ' + window.location.href, 'info');
      }
    });
  }

  function renderNotFound(msg) {
    detailsRoot.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h2 class="empty-state-title">Event Not Found</h2>
        <p class="empty-state-desc">${escapeHtml(msg)}</p>
        <a href="events.html" class="btn btn-primary">Browse All Events</a>
      </div>
    `;
  }
}
