/**
 * ==============================================================================
 * CAMPUSCONNECT - SHARED UI COMPONENTS & INTERACTION LAYER (ui.js)
 * ==============================================================================
 * University Viva & Technical Explanation:
 * - Role: Centralizes shared view logic (Navbar, Mobile Drawer, Footer, Toast alerts,
 *   Accessible confirmation modals, and the live seat progress bars).
 * - Component Reuse: Instead of duplicating navbar/footer markup across 10 pages,
 *   ui.js dynamically mounts them into designated placeholder tags (#site-header, #site-footer).
 * - DOM & Event Delegation: Notification popover and mobile drawer listeners utilize
 *   event delegation and click-outside patterns.
 * - Accessibility (a11y): Supports Escape-key listener to close modals/drawers and
 *   maintains high contrast semantic color tokens.
 * ==============================================================================
 */

/**
 * Renders the shared navigation bar and mobile drawer.
 * @param {string} activePage - Identifies the active menu item (e.g. 'home', 'events', 'my-registrations', 'dashboard', 'login')
 */
function renderNavbar(activePage = '') {
  const headerContainer = document.getElementById('site-header');
  if (!headerContainer) return;

  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const notifications = typeof getNotifications === 'function' ? getNotifications() : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const navHtml = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <div class="container">
      <div class="nav-wrapper">
        <!-- Brand Logo -->
        <a href="index.html" class="brand-logo" aria-label="CampusConnect Home">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <span>Campus<span class="accent">Connect</span></span>
        </a>

        <!-- Desktop Navigation Links -->
        <nav aria-label="Primary Navigation">
          <ul class="nav-links">
            <li><a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a></li>
            <li><a href="events.html" class="nav-link ${activePage === 'events' ? 'active' : ''}">Events</a></li>
            <li><a href="my-registrations.html" class="nav-link ${activePage === 'my-registrations' ? 'active' : ''}">My Registrations</a></li>
            ${currentUser && currentUser.role === 'admin' ? `
              <li>
                <a href="dashboard.html" class="nav-link ${['dashboard', 'manage-events', 'participants'].includes(activePage) ? 'active' : ''}" style="color: var(--primary); font-weight: 600;">
                  Admin Portal
                </a>
              </li>
            ` : ''}
          </ul>
        </nav>

        <!-- Right Action Controls -->
        <div class="nav-actions">
          <!-- Notification Bell -->
          <div class="notif-wrapper">
            <button id="notif-toggle-btn" class="notif-bell-btn" aria-label="View notifications" aria-expanded="false">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              ${unreadCount > 0 ? `<span class="notif-badge" id="notif-badge-count">${unreadCount}</span>` : ''}
            </button>

            <!-- Notifications Dropdown -->
            <div id="notif-dropdown-menu" class="notif-dropdown" role="region" aria-label="Notifications panel">
              <div class="notif-header">
                <span>Notifications (${notifications.length})</span>
                ${unreadCount > 0 ? `<button id="mark-all-read-btn" class="btn btn-sm btn-outline" style="padding: 2px 8px; font-size: 0.72rem;">Mark read</button>` : ''}
              </div>
              <ul class="notif-list" id="notif-list-items">
                ${notifications.length === 0 ? `
                  <li style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    No new notifications
                  </li>
                ` : notifications.slice(0, 6).map(n => `
                  <li class="notif-item">
                    <strong style="color: ${n.type === 'warning' ? 'var(--warning-text)' : n.type === 'success' ? 'var(--success-text)' : 'var(--text-main)'}; font-size: 0.85rem;">
                      ${escapeHtml(n.title)}
                    </strong>
                    <span style="color: var(--text-muted); line-height: 1.35;">${escapeHtml(n.message)}</span>
                    <span class="notif-time">${timeAgo(n.timestamp)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- User Authentication State -->
          ${currentUser ? `
            <div class="user-menu-pill">
              <div class="user-avatar">${getInitials(currentUser.name)}</div>
              <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(currentUser.name.split(' ')[0])}
              </span>
              <button onclick="logout()" class="btn btn-sm btn-outline" style="padding: 4px 8px; margin-left: 4px; font-size: 0.75rem;" title="Sign out">
                Logout
              </button>
            </div>
          ` : `
            <a href="login.html" class="btn btn-sm btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Sign In</span>
            </a>
          `}

          <!-- Mobile Hamburger Toggle Button -->
          <button id="mobile-menu-toggle" class="mobile-toggle-btn" aria-label="Open mobile navigation menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  headerContainer.innerHTML = navHtml;
  initNavbarInteractions();
  mountMobileDrawer(activePage, currentUser);
}

/**
 * Binds click interactions for notification dropdown and window clicks.
 */
function initNavbarInteractions() {
  const notifBtn = document.getElementById('notif-toggle-btn');
  const notifMenu = document.getElementById('notif-dropdown-menu');
  const markReadBtn = document.getElementById('mark-all-read-btn');

  if (notifBtn && notifMenu) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = notifMenu.classList.toggle('open');
      notifBtn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!notifMenu.contains(e.target) && e.target !== notifBtn) {
        notifMenu.classList.remove('open');
        notifBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (markReadBtn) {
    markReadBtn.addEventListener('click', () => {
      if (typeof markAllNotificationsRead === 'function') {
        markAllNotificationsRead();
        const badge = document.getElementById('notif-badge-count');
        if (badge) badge.remove();
        markReadBtn.remove();
        showToast('All notifications marked as read', 'info');
      }
    });
  }
}

/**
 * Creates and injects the responsive mobile drawer overlay.
 */
function mountMobileDrawer(activePage, currentUser) {
  let drawer = document.getElementById('mobile-drawer-overlay');
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'mobile-drawer-overlay';
    drawer.className = 'mobile-drawer';
    document.body.appendChild(drawer);
  }

  drawer.innerHTML = `
    <div class="drawer-panel">
      <div class="drawer-header">
        <a href="index.html" class="brand-logo">
          <div class="brand-icon" style="width: 32px; height: 32px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </div>
          <span style="font-size: 1.2rem;">Campus<span class="accent">Connect</span></span>
        </a>
        <button id="close-drawer-btn" class="btn btn-sm btn-outline" style="border: none; padding: 4px;" aria-label="Close menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <nav>
        <ul class="drawer-nav-list">
          <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">🏠 Home</a></li>
          <li><a href="events.html" class="${activePage === 'events' ? 'active' : ''}">📅 Browse Events</a></li>
          <li><a href="my-registrations.html" class="${activePage === 'my-registrations' ? 'active' : ''}">🎟️ My Registrations</a></li>
          ${currentUser && currentUser.role === 'admin' ? `
            <li style="border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Admin Panel</span>
            </li>
            <li><a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">📊 Overview Dashboard</a></li>
            <li><a href="manage-events.html" class="${activePage === 'manage-events' ? 'active' : ''}">⚙️ Manage Events</a></li>
            <li><a href="participants.html" class="${activePage === 'participants' ? 'active' : ''}">👥 Attendees List</a></li>
          ` : ''}
        </ul>
      </nav>

      <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--border);">
        ${currentUser ? `
          <div style="margin-bottom: 0.85rem;">
            <div style="font-weight: 600; font-size: 0.95rem;">${escapeHtml(currentUser.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(currentUser.email)}</div>
            <span class="badge ${currentUser.role === 'admin' ? 'badge-fest' : 'badge-workshop'}" style="margin-top: 0.35rem;">
              ${currentUser.role.toUpperCase()}
            </span>
          </div>
          <button onclick="logout()" class="btn btn-outline btn-full btn-sm">Sign Out</button>
        ` : `
          <a href="login.html" class="btn btn-primary btn-full">Sign In to Account</a>
        `}
      </div>
    </div>
  `;

  // Bind drawer open/close
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const closeBtn = document.getElementById('close-drawer-btn');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      drawer.classList.add('open');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  }

  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) {
      drawer.classList.remove('open');
    }
  });
}

/**
 * Renders the shared university portal footer.
 */
function renderFooter() {
  const footerContainer = document.getElementById('site-footer');
  if (!footerContainer) return;

  const footerHtml = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand-title">Campus<span style="color: var(--accent);">Connect</span></div>
          <p style="font-size: 0.9rem; line-height: 1.6; max-width: 340px; margin-bottom: 1.25rem;">
            The unified campus event management and real-time registration platform. Designed for collegiate life, academic symposiums, and student organizations.
          </p>
          <div style="display: flex; gap: 0.75rem;">
            <span class="badge badge-fest">🎓 University Portal</span>
            <span class="badge badge-workshop">🚀 100% Client-Side</span>
          </div>
        </div>

        <div>
          <h4 class="footer-heading">Explore Portal</h4>
          <ul class="footer-links-list">
            <li><a href="index.html">Home Overview</a></li>
            <li><a href="events.html">All Campus Events</a></li>
            <li><a href="my-registrations.html">My Registrations</a></li>
            <li><a href="login.html">Sign In / Register</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-heading">Organizers</h4>
          <ul class="footer-links-list">
            <li><a href="dashboard.html">Admin Dashboard</a></li>
            <li><a href="manage-events.html">Create & Edit Events</a></li>
            <li><a href="participants.html">Export Attendees CSV</a></li>
            <li><a href="javascript:void(0)" onclick="confirmResetDatabase()">Reset Demo Database</a></li>
          </ul>
        </div>

        <div>
          <h4 class="footer-heading">Help & Support</h4>
          <ul class="footer-links-list">
            <li><span style="color: #cbd5e1;">📍 Student Activity Center</span></li>
            <li><span style="color: #cbd5e1;">📧 support@campus.edu</span></li>
            <li><span style="color: #cbd5e1;">📞 +1 (800) 555-CAMPUS</span></li>
            <li><span style="color: #cbd5e1;">⏰ Mon-Fri: 9am - 5pm</span></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom-bar">
        <div>
          © ${new Date().getFullYear()} CampusConnect. All rights reserved. Built for University Event Operations.
        </div>
        <div style="display: flex; gap: 1.5rem;">
          <a href="events.html">Privacy Policy</a>
          <a href="events.html">Terms of Participation</a>
          <a href="events.html">Student Honor Code</a>
        </div>
      </div>
    </div>
  `;

  footerContainer.innerHTML = footerHtml;
}

/**
 * Creates dynamic live seat counter & progress bar HTML.
 * Color shifts smoothly:
 * - Green (>50% remaining)
 * - Orange (15% to 50% remaining)
 * - Red (<15% remaining or 0 left)
 * 
 * @param {number} seatsLeft - Remaining seats
 * @param {number} seatLimit - Total seats available
 * @returns {string} HTML markup
 */
function renderSeatProgressBar(seatsLeft, seatLimit) {
  const safeLimit = Math.max(1, seatLimit || 1);
  const safeLeft = Math.max(0, seatsLeft || 0);
  const seatsBooked = safeLimit - safeLeft;
  const percentFilled = Math.min(100, Math.round((seatsBooked / safeLimit) * 100));
  const percentRemaining = 100 - percentFilled;

  let colorClass = 'progress-fill-green';
  let statusText = `${safeLeft} / ${safeLimit} seats left`;
  let badgeHtml = `<span class="badge badge-open">Open</span>`;

  if (safeLeft === 0) {
    colorClass = 'progress-fill-red';
    statusText = `0 / ${safeLimit} seats left`;
    badgeHtml = `<span class="badge badge-full">Event Full</span>`;
  } else if (safeLeft <= 5 || percentRemaining <= 15) {
    colorClass = 'progress-fill-red';
    statusText = `Only ${safeLeft} left!`;
    badgeHtml = `<span class="badge badge-almost-full">Almost Full</span>`;
  } else if (percentRemaining <= 50) {
    colorClass = 'progress-fill-orange';
    statusText = `${safeLeft} / ${safeLimit} seats left`;
    badgeHtml = `<span class="badge badge-open">Filling Fast</span>`;
  }

  return `
    <div class="seat-indicator-box">
      <div class="seat-status-row">
        <span class="seat-counter-text">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <strong>${statusText}</strong>
        </span>
        ${badgeHtml}
      </div>
      <div class="progress-track" title="${percentFilled}% seats booked">
        <div class="progress-bar-fill ${colorClass}" style="width: ${percentFilled}%;"></div>
      </div>
    </div>
  `;
}

/**
 * Toast notification dispatcher.
 * Automatically injects toast container into body and dismisses after duration.
 * 
 * @param {string} message - Message text
 * @param {'success'|'error'|'warning'|'info'} type - Semantic notification level
 * @param {number} duration - Milliseconds before auto dismiss
 */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-notification-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-notification-root';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');

  // Pick semantic icon
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-message">${escapeHtml(message)}</div>
    <button class="toast-close-btn" aria-label="Dismiss toast">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close-btn');
  closeBtn.addEventListener('click', () => removeToast(toast));

  container.appendChild(toast);

  // Auto-dismiss timeout
  const timeoutId = setTimeout(() => {
    removeToast(toast);
  }, duration);

  function removeToast(el) {
    clearTimeout(timeoutId);
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 250);
  }
}
window.showToast = showToast; // Expose globally for storage.js

/**
 * Displays a styled confirmation modal dialog with callbacks.
 * 
 * @param {Object} options
 * @param {string} options.title - Header title
 * @param {string} options.message - Body explanation
 * @param {string} [options.confirmText='Confirm'] - Action button text
 * @param {string} [options.cancelText='Cancel'] - Dismiss button text
 * @param {boolean} [options.isDestructive=false] - If true, uses red danger button
 * @param {Function} options.onConfirm - Callback when confirmed
 */
function showConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm
}) {
  let modalOverlay = document.getElementById('global-modal-overlay');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'global-modal-overlay';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h3 id="modal-title" style="font-size: 1.15rem; font-weight: 700; color: var(--text-main);">${escapeHtml(title)}</h3>
        <button id="modal-close-icon" class="btn btn-sm btn-outline" style="border: none; padding: 4px;" aria-label="Close dialog">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p>${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button id="modal-cancel-btn" class="btn btn-outline btn-sm">${escapeHtml(cancelText)}</button>
        <button id="modal-confirm-btn" class="btn btn-sm ${isDestructive ? 'btn-danger' : 'btn-primary'}">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  modalOverlay.classList.add('open');

  const closeDialog = () => {
    modalOverlay.classList.remove('open');
  };

  const confirmAction = () => {
    closeDialog();
    if (typeof onConfirm === 'function') onConfirm();
  };

  modalOverlay.querySelector('#modal-close-icon').addEventListener('click', closeDialog);
  modalOverlay.querySelector('#modal-cancel-btn').addEventListener('click', closeDialog);
  modalOverlay.querySelector('#modal-confirm-btn').addEventListener('click', confirmAction);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeDialog();
  });

  const escHandler = (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeDialog();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/**
 * Helper to prompt reset of the demo database.
 */
function confirmResetDatabase() {
  showConfirmModal({
    title: 'Reset Portal Database?',
    message: 'This will reset all events, demo registrations, and users back to initial university defaults. Any newly created test events will be cleared.',
    confirmText: 'Reset to Factory Defaults',
    isDestructive: true,
    onConfirm: () => {
      if (typeof resetDatabase === 'function') {
        resetDatabase();
        showToast('Database reset successfully! Reloading page...', 'success');
        setTimeout(() => window.location.reload(), 800);
      }
    }
  });
}

/**
 * ==============================================================================
 * FORMATTING & SECURITY UTILITIES
 * ==============================================================================
 */

/**
 * Sanitizes strings against XSS injection before DOM injection.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats date string into human-friendly format (e.g. "Nov 15, 2026").
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Calculates human relative time (e.g. "5m ago", "2h ago").
 */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch (e) {
    return '';
  }
}

/**
 * Extracts student initials for the avatar icon.
 */
function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Returns formatted category pill badge.
 */
function getCategoryBadge(category) {
  const cat = (category || 'General').trim();
  const lower = cat.toLowerCase();
  return `<span class="badge badge-${lower}">${escapeHtml(cat)}</span>`;
}
