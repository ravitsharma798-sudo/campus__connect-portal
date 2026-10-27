/**
 * ==============================================================================
 * CAMPUSCONNECT - AUTHENTICATION & ROLE-BASED ACCESS CONTROL (auth.js)
 * ==============================================================================
 * University Viva & Technical Explanation:
 * - Purpose: Implements client-side role-based authentication (Student vs Admin/Organizer)
 *   and route protection for multi-page static web apps.
 * - Architecture: Emulates session state using localStorage key 'campusconnect_current_user'.
 * - Route Guards: The requireAdmin() and requireAuth() functions execute immediately upon
 *   DOM load on protected administrative pages (dashboard, manage-events, participants).
 *   If the session is invalid or lacks privileges, the script performs a window.location.replace
 *   with an encoded redirect query parameter.
 * - Real-world Note for Viva: In production systems, client-side route guards are visual only;
 *   true security is enforced server-side using cryptographic JWT tokens and HTTP-only cookies.
 * ==============================================================================
 */

/**
 * Retrieves the currently active user session from localStorage.
 * @returns {Object|null} User object or null if not logged in.
 */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Error reading current user session:', e);
    return null;
  }
}

/**
 * Sets the active user session in localStorage.
 * @param {Object} user - The user object to persist.
 */
function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } else {
    // Exclude password from current session storage for safety
    const safeUser = { ...user };
    delete safeUser.password;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
  }
}

/**
 * Checks if a user is currently authenticated.
 * @returns {boolean}
 */
function isAuthenticated() {
  return getCurrentUser() !== null;
}

/**
 * Checks if the current authenticated user has an 'admin' role.
 * @returns {boolean}
 */
function isAdmin() {
  const user = getCurrentUser();
  return user !== null && user.role === 'admin';
}

/**
 * Authenticates user against registered accounts in localStorage.
 * 
 * @param {string} email - User email address.
 * @param {string} password - User password.
 * @param {'student'|'admin'} expectedRole - Role toggle selected on form.
 * @returns {{success: boolean, message: string, user?: Object}}
 */
function login(email, password, expectedRole = 'student') {
  initializeStorage();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // Retrieve user directory
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch (e) {
    users = [];
  }

  // Find match
  const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass);

  if (!user) {
    return {
      success: false,
      message: 'Invalid email or password. Please verify your credentials or use the demo accounts below.'
    };
  }

  if (user.role !== expectedRole) {
    return {
      success: false,
      message: `Role mismatch: This account is registered as a ${user.role.toUpperCase()}, but you attempted to sign in as ${expectedRole.toUpperCase()}.`
    };
  }

  // Set active session
  setCurrentUser(user);
  addNotification('Login Successful', `Welcome back, ${user.name}!`, 'success');

  return {
    success: true,
    message: `Welcome back, ${user.name}!`,
    user: user
  };
}

/**
 * Registers a new user account into localStorage.
 * 
 * @param {Object} userData - Registration payload (name, email, password, role, regNumber, department, etc.)
 * @returns {{success: boolean, message: string, user?: Object}}
 */
function signup(userData) {
  initializeStorage();
  const cleanEmail = userData.email.trim().toLowerCase();

  let users = [];
  try {
    users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch (e) {
    users = [];
  }

  // Prevent duplicate account registration
  const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return {
      success: false,
      message: `An account with email "${cleanEmail}" already exists. Please sign in instead.`
    };
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: userData.name.trim(),
    email: cleanEmail,
    password: userData.password,
    role: userData.role || 'student',
    regNumber: userData.regNumber ? userData.regNumber.trim() : '',
    phone: userData.phone ? userData.phone.trim() : '',
    department: userData.department || 'General',
    year: userData.year || '1st Year',
    registeredAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  // Automatically sign in upon registration
  setCurrentUser(newUser);
  addNotification('Account Created', `Welcome to CampusConnect, ${newUser.name}!`, 'success');

  return {
    success: true,
    message: 'Your account has been created successfully!',
    user: newUser
  };
}

/**
 * Destroys current session and redirects to login or home page.
 */
function logout() {
  const user = getCurrentUser();
  const userName = user ? user.name : 'User';
  setCurrentUser(null);
  
  if (typeof window.showToast === 'function') {
    window.showToast(`Logged out successfully. Goodbye ${userName}!`, 'info');
  }

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 400);
}

/**
 * Client-Side Administrative Route Guard.
 * Call this at top of administrative scripts (dashboard.js, manage-events, participants).
 * If user is not an admin, immediately redirects to login.html with the destination encoded.
 */
function requireAdmin() {
  if (!isAdmin()) {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    // Use relative redirect
    window.location.replace(`login.html?redirect=${encodeURIComponent(currentPage)}&reason=admin_required`);
  }
}

/**
 * Client-Side Authentication Route Guard.
 * Enforces that a visitor must be signed in (student or admin).
 */
function requireAuth() {
  if (!isAuthenticated()) {
    const currentPage = window.location.pathname.split('/').pop() || 'my-registrations.html';
    window.location.replace(`login.html?redirect=${encodeURIComponent(currentPage)}&reason=login_required`);
  }
}
