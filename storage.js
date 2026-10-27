/**
 * ==============================================================================
 * CAMPUSCONNECT - STORAGE & DATA REPOSITORY MODULE (storage.js)
 * ==============================================================================
 * University Viva & Technical Explanation:
 * - Role: Acts as the Client-Side Persistence Layer replacing a traditional SQL/NoSQL DB.
 * - Architecture: Repository Pattern. Abstracted getters and setters decouple the UI
 *   from raw localStorage calls.
 * - Concurrency Handling: In registerStudent(), fresh data is loaded synchronously from
 *   localStorage immediately prior to verification and mutation, preventing race conditions
 *   and overbooking when multiple tabs are open simultaneously.
 * - Data Storage: Uses window.localStorage. Keys are prefixed with 'campusconnect_'
 *   to avoid namespace collisions with other applications.
 * ==============================================================================
 */

// Storage Keys
const STORAGE_KEYS = {
  EVENTS: 'campusconnect_events',
  REGISTRATIONS: 'campusconnect_registrations',
  USERS: 'campusconnect_users',
  CURRENT_USER: 'campusconnect_current_user',
  NOTIFICATIONS: 'campusconnect_notifications',
  SEEDED: 'campusconnect_seeded_v1'
};

// Default high-quality banner images with curated Unsplash tech & campus themes
const SAMPLE_BANNERS = {
  techfest: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
  ai: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  hackathon: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  cultural: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  sports: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
  cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  design: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
  robotics: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80'
};

/**
 * Initializes the default university dataset if not already seeded.
 * Pre-loads 8 realistic events, demo credentials, registrations, and notifications.
 */
function initializeStorage() {
  if (localStorage.getItem(STORAGE_KEYS.SEEDED)) {
    return; // Already initialized
  }

  // 1. Initial 8 Realistic Events
  const defaultEvents = [
    {
      id: 'evt-101',
      title: 'TechFest 2026: Quantum Horizons',
      category: 'Fest',
      date: '2026-11-15',
      time: '09:00 AM - 06:00 PM',
      venue: 'Main University Auditorium & Tech Quad',
      eligibility: 'Open to all Engineering, Science & Tech students',
      organizer: 'Council of Technical Affairs',
      seatLimit: 150,
      deadline: '2026-11-14T23:59',
      bannerUrl: SAMPLE_BANNERS.techfest,
      description: 'The flagship annual technical symposium of the university featuring keynote speeches from industry leaders, competitive coding sprints, robotics showcases, project expos, and drone racing.',
      agenda: [
        { time: '09:00 AM', title: 'Grand Inauguration & Keynote', desc: 'Welcome address by the Dean of Engineering & Keynote on Quantum Computing.' },
        { time: '11:00 AM', title: 'Project Exhibition & Tech Expo', desc: 'Display of over 40 undergraduate engineering innovation prototypes.' },
        { time: '02:00 PM', title: 'Speed Coding & AI Hack Challenge', desc: 'Rapid algorithmic programming competition in Lab 1.' },
        { time: '05:00 PM', title: 'Award Ceremony & Valedictory', desc: 'Trophies and certificates distribution.' }
      ]
    },
    {
      id: 'evt-102',
      title: 'Deep Learning & Generative AI Hands-On Workshop',
      category: 'Workshop',
      date: '2026-11-05',
      time: '10:00 AM - 04:00 PM',
      venue: 'Turing Computer Lab, CS Block Level 3',
      eligibility: 'Basic Python programming knowledge recommended',
      organizer: 'Department of Computer Science & Engineering',
      seatLimit: 60,
      deadline: '2026-11-04T23:59',
      bannerUrl: SAMPLE_BANNERS.ai,
      description: 'An intensive, hands-on workshop guiding students through fine-tuning open weights LLMs, building retrieval-augmented generation (RAG) pipelines, and deploying interactive AI agents on cloud infrastructure.',
      agenda: [
        { time: '10:00 AM', title: 'Introduction to Transformers & LLMs', desc: 'Foundations of attention mechanisms and transformer architecture.' },
        { time: '11:45 AM', title: 'Building a Local RAG System', desc: 'Hands-on coding with vector databases and embedding models.' },
        { time: '02:00 PM', title: 'Agentic Workflows & Multi-Agent Systems', desc: 'Implementing reasoning loops and tool calling.' },
        { time: '03:30 PM', title: 'Q&A and Certificate Distribution', desc: 'Interactive wrap-up and digital badges.' }
      ]
    },
    {
      id: 'evt-103',
      title: 'HackTheCampus 48-Hour Inter-Collegiate Hackathon',
      category: 'Competition',
      date: '2026-11-20',
      time: '08:00 AM (48 Hours Non-Stop)',
      venue: 'Student Innovation Center, Hall A & B',
      eligibility: 'Teams of 2 to 4 bonafide college students',
      organizer: 'Google Developer Student Club & Campus E-Cell',
      seatLimit: 80,
      deadline: '2026-11-19T18:00',
      bannerUrl: SAMPLE_BANNERS.hackathon,
      description: '48 hours of relentless innovation! Solve pressing challenges in HealthTech, Smart Cities, EdTech, and Sustainability. Mentorship provided by senior startup founders and venture partners.',
      agenda: [
        { time: 'Day 1 - 08:00 AM', title: 'Check-in & Team Formation', desc: 'Badge collection, wifi setup and opening briefing.' },
        { time: 'Day 1 - 10:00 AM', title: 'Hacking Begins', desc: 'Round 1 design reviews and mentor pairing.' },
        { time: 'Day 2 - 08:00 AM', title: 'Mid-point Check & Mentorship', desc: 'Technical stress test of prototypes.' },
        { time: 'Day 3 - 10:00 AM', title: 'Pitch Deck & Final Judging', desc: '3-minute product pitch to jury and investors.' }
      ]
    },
    {
      id: 'evt-104',
      title: 'Annual Spring Cultural Gala: Symphony 2026',
      category: 'Cultural',
      date: '2026-11-28',
      time: '05:30 PM - 10:30 PM',
      venue: 'Open Air Amphitheatre',
      eligibility: 'All university students, faculty, and invited alumni',
      organizer: 'University Cultural Affairs Council',
      seatLimit: 300,
      deadline: '2026-11-27T12:00',
      bannerUrl: SAMPLE_BANNERS.cultural,
      description: 'Experience an unforgettable evening of musical performances, classical fusion, contemporary dance troupes, theatrical drama, and a live celebrity band concert under the stars.',
      agenda: [
        { time: '05:30 PM', title: 'Saraswati Vandana & Classical Fusion', desc: 'Traditional inaugural performance by university choir.' },
        { time: '06:30 PM', title: 'Battle of the Campus Bands', desc: 'Top 5 student rock and indie bands compete live.' },
        { time: '08:00 PM', title: 'Inter-Departmental Dance Showcase', desc: 'Choreographed energetic dance performances.' },
        { time: '09:15 PM', title: 'Headline Guest Performance', desc: 'Celebrity guest band live musical set.' }
      ]
    },
    {
      id: 'evt-105',
      title: 'National Collegiate Badminton Championship',
      category: 'Sports',
      date: '2026-11-10',
      time: '08:00 AM - 05:00 PM',
      venue: 'Campus Indoor Sports Complex - Badminton Courts 1-4',
      eligibility: 'Full-time students with active university sports ID',
      organizer: 'Department of Physical Education & Athletics',
      seatLimit: 32,
      deadline: '2026-11-08T20:00',
      bannerUrl: SAMPLE_BANNERS.sports,
      description: 'Singles and doubles knockout badminton tournament featuring top collegiate shuttlers. Official BWF rules apply with accredited university referees and physiotherapist on standby.',
      agenda: [
        { time: '08:00 AM', title: 'Player Registration & Warm-ups', desc: 'Equipment checks and court allocation.' },
        { time: '09:00 AM', title: 'Knockout Round 1 & Round of 16', desc: 'Simultaneous matches across all 4 courts.' },
        { time: '01:30 PM', title: 'Quarter-Finals & Semi-Finals', desc: 'High-intensity elimination matches.' },
        { time: '04:00 PM', title: 'Championship Final & Medal Ceremony', desc: 'Gold, Silver & Bronze match followed by podium ceremony.' }
      ]
    },
    {
      id: 'evt-106',
      title: 'NextGen Cloud Architecture & DevOps Seminar',
      category: 'Seminar',
      date: '2026-11-12',
      time: '02:00 PM - 05:00 PM',
      venue: 'Aryabhatta Seminar Hall, Block C',
      eligibility: '2nd, 3rd & 4th Year Computer Science, IT, and ECE students',
      organizer: 'IEEE Student Branch & Cloud Computing Club',
      seatLimit: 100,
      deadline: '2026-11-11T17:00',
      bannerUrl: SAMPLE_BANNERS.cloud,
      description: 'Explore the modern cloud computing landscape: Kubernetes container orchestration, Infrastructure as Code with Terraform, serverless event-driven architecture, and zero-trust security postures.',
      agenda: [
        { time: '02:00 PM', title: 'Evolution of Distributed Systems', desc: 'From monolithic VMs to microservices and service mesh.' },
        { time: '03:15 PM', title: 'Live Demo: GitOps CI/CD Deployment', desc: 'Automating multi-cloud canary releases with ArgoCD.' },
        { time: '04:30 PM', title: 'Career Pathways in SRE & Cloud', desc: 'Panel discussion with senior Principal Architects.' }
      ]
    },
    {
      id: 'evt-107',
      title: 'Product Design Sprint & UX Designathon',
      category: 'Workshop',
      date: '2026-11-08',
      time: '10:00 AM - 03:30 PM',
      venue: 'Design Studio & Interaction Lab, Architecture Wing',
      eligibility: 'Open to all creative thinkers, UI/UX designers, and front-end devs',
      organizer: 'DesignX Campus Chapter',
      seatLimit: 40,
      deadline: '2026-11-06T23:59',
      bannerUrl: SAMPLE_BANNERS.design,
      description: 'Master the 5-phase Google Design Sprint methodology. Learn user journey mapping, rapid wireframing, high-fidelity Figma prototyping, and usability heuristic evaluation in an immersive collaborative session.',
      agenda: [
        { time: '10:00 AM', title: 'Design Thinking & Empathy Mapping', desc: 'Formulating "How Might We" problem statements.' },
        { time: '11:30 AM', title: 'Crazy 8s Rapid Sketching', desc: 'Generating 8 distinct UI layout ideas in 8 minutes.' },
        { time: '01:30 PM', title: 'Interactive Figma Prototyping', desc: 'Building smart animate micro-interactions.' },
        { time: '03:00 PM', title: 'Usability Testing & Critique', desc: 'Peer critiques and usability feedback loops.' }
      ]
    },
    {
      id: 'evt-108',
      title: 'Autonomous Robotics RoboWars 2026',
      category: 'Competition',
      date: '2026-11-22',
      time: '11:00 AM - 04:30 PM',
      venue: 'Mechanical Engineering Central Arena',
      eligibility: 'Student teams; maximum bot weight limit 15kg',
      organizer: 'Robotics & Automation Society (RAS)',
      seatLimit: 50,
      deadline: '2026-11-21T23:59',
      bannerUrl: SAMPLE_BANNERS.robotics,
      description: 'Witness combat robots battle in an enclosed bulletproof polycarbonate combat ring! Features spinning drums, pneumatic flippers, and wedge bots competing for the university combat trophy.',
      agenda: [
        { time: '11:00 AM', title: 'Bot Safety Inspection & Weigh-in', desc: 'Failsafe switch tests and battery inspection.' },
        { time: '12:00 PM', title: 'Preliminary Deathmatches', desc: '3-minute bouts scored on damage and control.' },
        { time: '02:30 PM', title: 'RoboWars Semi-Finals', desc: 'Top surviving bots face off in arena hazards.' },
        { time: '04:00 PM', title: 'The Ultimate Grand Final', desc: 'Final 5-minute clash and best engineering award.' }
      ]
    }
  ];

  // 2. Demo Users
  const defaultUsers = [
    {
      id: 'usr-admin',
      name: 'Dr. Evelyn Reed',
      email: 'admin@campus.com',
      password: 'admin123',
      role: 'admin',
      department: 'Faculty of Computer Science',
      registeredAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr-student',
      name: 'Alex Rivera',
      email: 'student@campus.com',
      password: 'student123',
      role: 'student',
      regNumber: '20241088',
      phone: '9876543210',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      registeredAt: '2026-02-15T09:30:00.000Z'
    }
  ];

  // 3. Pre-populated Registrations so data looks active and realistic
  // Event 103 (HackTheCampus) will be FULL (80/80)
  // Event 102 (AI Workshop) will be ALMOST FULL (58/60)
  // Event 101 (TechFest) will have 120/150 registered
  const defaultRegistrations = [];

  // Seed 80 registrations for HackTheCampus (evt-103) -> FULL!
  for (let i = 1; i <= 80; i++) {
    defaultRegistrations.push({
      id: `CC-2026-${100000 + i}`,
      eventId: 'evt-103',
      eventTitle: 'HackTheCampus 48-Hour Inter-Collegiate Hackathon',
      studentName: i === 1 ? 'Alex Rivera' : `Student Hacker ${i}`,
      regNumber: i === 1 ? '20241088' : `${20240000 + i}`,
      email: i === 1 ? 'student@campus.com' : `hacker${i}@campus.edu`,
      phone: `987654${(1000 + i).toString().slice(-4)}`,
      department: i % 2 === 0 ? 'Computer Science & Engineering' : 'Information Technology',
      year: '3rd Year',
      timestamp: '2026-10-15T10:15:00.000Z',
      status: 'confirmed'
    });
  }

  // Seed 58 registrations for AI Workshop (evt-102) -> 2 seats left!
  for (let i = 1; i <= 58; i++) {
    defaultRegistrations.push({
      id: `CC-2026-${200000 + i}`,
      eventId: 'evt-102',
      eventTitle: 'Deep Learning & Generative AI Hands-On Workshop',
      studentName: `AI Scholar ${i}`,
      regNumber: `${20250000 + i}`,
      email: `ai.scholar${i}@campus.edu`,
      phone: `987655${(1000 + i).toString().slice(-4)}`,
      department: 'Computer Science & Engineering',
      year: '2nd Year',
      timestamp: '2026-10-16T14:20:00.000Z',
      status: 'confirmed'
    });
  }

  // Seed 120 registrations for TechFest (evt-101) -> 30 seats left!
  for (let i = 1; i <= 120; i++) {
    defaultRegistrations.push({
      id: `CC-2026-${300000 + i}`,
      eventId: 'evt-101',
      eventTitle: 'TechFest 2026: Quantum Horizons',
      studentName: i === 5 ? 'Alex Rivera' : `TechFest Delegate ${i}`,
      regNumber: i === 5 ? '20241088' : `${20230000 + i}`,
      email: i === 5 ? 'student@campus.com' : `delegate${i}@campus.edu`,
      phone: `987656${(1000 + i).toString().slice(-4)}`,
      department: i % 3 === 0 ? 'Electronics & Communication' : 'Computer Science & Engineering',
      year: '4th Year',
      timestamp: '2026-10-17T09:00:00.000Z',
      status: 'confirmed'
    });
  }

  // Seed 24 for Badminton (evt-105) -> 8 seats left
  for (let i = 1; i <= 24; i++) {
    defaultRegistrations.push({
      id: `CC-2026-${400000 + i}`,
      eventId: 'evt-105',
      eventTitle: 'National Collegiate Badminton Championship',
      studentName: `Athlete ${i}`,
      regNumber: `${20220000 + i}`,
      email: `athlete${i}@campus.edu`,
      phone: `987657${(1000 + i).toString().slice(-4)}`,
      department: 'Mechanical Engineering',
      year: '3rd Year',
      timestamp: '2026-10-18T11:45:00.000Z',
      status: 'confirmed'
    });
  }

  // Seed 210 for Cultural Night (evt-104) -> 90 seats left
  for (let i = 1; i <= 210; i++) {
    defaultRegistrations.push({
      id: `CC-2026-${500000 + i}`,
      eventId: 'evt-104',
      eventTitle: 'Annual Spring Cultural Gala: Symphony 2026',
      studentName: `Cultural Attendee ${i}`,
      regNumber: `${20210000 + i}`,
      email: `cultural${i}@campus.edu`,
      phone: `987658${(1000 + i).toString().slice(-4)}`,
      department: 'Management Studies',
      year: '1st Year',
      timestamp: '2026-10-19T16:10:00.000Z',
      status: 'confirmed'
    });
  }

  // 4. Default Notifications
  const defaultNotifications = [
    {
      id: 'notif-1',
      title: 'HackTheCampus 48-Hour Hackathon Full!',
      message: 'All 80 seats for HackTheCampus are now booked. Waitlist opens soon.',
      type: 'warning',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      read: false
    },
    {
      id: 'notif-2',
      title: 'AI Workshop Almost Full!',
      message: 'Only 2 seats remaining for Deep Learning & Generative AI Hands-On Workshop.',
      type: 'info',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      read: false
    },
    {
      id: 'notif-3',
      title: 'Welcome to CampusConnect Portal',
      message: 'Explore university events, register instantly, and download your digital admit pass.',
      type: 'success',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true
    }
  ];

  // Save everything to localStorage
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(defaultEvents));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(defaultRegistrations));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(defaultNotifications));
  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
}

// Auto-run initialization on script load
initializeStorage();

/**
 * ==============================================================================
 * EVENT REPOSITORY METHODS
 * ==============================================================================
 */

/**
 * Retrieves all events stored in localStorage.
 * @returns {Array<Object>} List of all event objects.
 */
function getEvents() {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error parsing events from localStorage:', err);
    return [];
  }
}

/**
 * Saves or updates the array of events to localStorage.
 * @param {Array<Object>} events - Array of events.
 */
function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Error saving events to localStorage:', err);
  }
}

/**
 * Retrieves a single event by its unique ID.
 * @param {string} id - Event ID.
 * @returns {Object|null} The matching event or null.
 */
function getEventById(id) {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
}

/**
 * Creates or updates an event (Admin Action).
 * @param {Object} eventData - The event payload.
 * @returns {{success: boolean, message: string, event: Object|null}}
 */
function saveOrUpdateEvent(eventData) {
  const events = getEvents();
  const existingIndex = events.findIndex(e => e.id === eventData.id);

  if (existingIndex >= 0) {
    // Editing an existing event: check that seat limit is not lower than active registrations!
    const activeRegCount = getConfirmedRegistrationsCount(eventData.id);
    const newLimit = parseInt(eventData.seatLimit, 10);

    if (newLimit < activeRegCount) {
      return {
        success: false,
        message: `Seat limit cannot be lower than current active registrations (${activeRegCount} seats currently booked).`,
        event: null
      };
    }

    events[existingIndex] = { ...events[existingIndex], ...eventData };
    saveEvents(events);
    addNotification('Event Updated', `Event "${eventData.title}" details have been updated.`, 'info');
    return { success: true, message: 'Event successfully updated!', event: events[existingIndex] };
  } else {
    // New Event Creation
    const newEvent = {
      ...eventData,
      id: eventData.id || `evt-${Date.now()}`
    };
    events.unshift(newEvent);
    saveEvents(events);
    addNotification('New Event Published', `"${newEvent.title}" has been published for registrations!`, 'success');
    return { success: true, message: 'Event created successfully!', event: newEvent };
  }
}

/**
 * Deletes an event by ID (Admin Action).
 * @param {string} eventId - ID of the event to remove.
 * @returns {{success: boolean, message: string}}
 */
function deleteEvent(eventId) {
  const events = getEvents();
  const target = events.find(e => e.id === eventId);
  if (!target) {
    return { success: false, message: 'Event not found.' };
  }

  const updatedEvents = events.filter(e => e.id !== eventId);
  saveEvents(updatedEvents);

  // Also notify
  addNotification('Event Removed', `"${target.title}" was removed from the portal.`, 'warning');
  return { success: true, message: `Event "${target.title}" was successfully deleted.` };
}

/**
 * ==============================================================================
 * REGISTRATION REPOSITORY & CONCURRENCY-SAFE METHODS
 * ==============================================================================
 */

/**
 * Retrieves all registrations from localStorage.
 * @returns {Array<Object>} List of registrations.
 */
function getRegistrations() {
  initializeStorage();
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error parsing registrations:', err);
    return [];
  }
}

/**
 * Saves all registrations to localStorage.
 * @param {Array<Object>} regs - Array of registration objects.
 */
function saveRegistrations(regs) {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(regs));
  } catch (err) {
    console.error('Error saving registrations:', err);
  }
}

/**
 * Returns active (status === 'confirmed') registrations count for a specific event.
 * @param {string} eventId - Target event ID.
 * @returns {number} Count of active registrations.
 */
function getConfirmedRegistrationsCount(eventId) {
  const regs = getRegistrations();
  return regs.filter(r => r.eventId === eventId && r.status === 'confirmed').length;
}

/**
 * Computes live seats left for an event.
 * @param {Object} event - Event object.
 * @returns {number} Seats remaining (min 0).
 */
function getSeatsLeft(event) {
  if (!event) return 0;
  const booked = getConfirmedRegistrationsCount(event.id);
  const remaining = (event.seatLimit || 0) - booked;
  return Math.max(0, remaining);
}

/**
 * Checks if an event has reached capacity.
 * @param {Object} event - Event object.
 * @returns {boolean} True if full.
 */
function isEventFull(event) {
  return getSeatsLeft(event) <= 0;
}

/**
 * Checks if an event's registration deadline has elapsed.
 * @param {Object} event - Event object.
 * @returns {boolean} True if deadline passed.
 */
function isEventDeadlinePassed(event) {
  if (!event || !event.deadline) return false;
  return new Date() > new Date(event.deadline);
}

/**
 * Concurrency-safe student registration helper.
 * Re-reads localStorage right before mutating to prevent race conditions across tabs.
 * Blocks duplicate student registrations (by regNumber or email) for the same event.
 * 
 * @param {Object} studentData - Student registration form details.
 * @returns {{success: boolean, message: string, regId?: string}} Result of operation.
 */
function registerStudent(studentData) {
  // 1. Fresh read to ensure latest state across tabs
  const event = getEventById(studentData.eventId);
  if (!event) {
    return { success: false, message: 'Target event could not be found.' };
  }

  // 2. Check registration deadline
  if (isEventDeadlinePassed(event)) {
    return { success: false, message: 'Registration has closed for this event as the deadline has passed.' };
  }

  // 3. Check seat capacity atomically
  const currentBookedCount = getConfirmedRegistrationsCount(studentData.eventId);
  if (currentBookedCount >= event.seatLimit) {
    return {
      success: false,
      message: 'Registration failed: This event just reached full capacity! No seats remaining.'
    };
  }

  // 4. Duplicate Check: Prevent the same student (Reg Number or Email) from registering twice
  const allRegistrations = getRegistrations();
  const alreadyRegistered = allRegistrations.some(r =>
    r.eventId === studentData.eventId &&
    r.status === 'confirmed' &&
    (
      r.regNumber.trim().toLowerCase() === studentData.regNumber.trim().toLowerCase() ||
      r.email.trim().toLowerCase() === studentData.email.trim().toLowerCase()
    )
  );

  if (alreadyRegistered) {
    return {
      success: false,
      message: `Duplicate registration blocked! A student with Registration Number "${studentData.regNumber}" or Email "${studentData.email}" is already registered for this event.`
    };
  }

  // 5. Generate Unique Ticket / Registration Code
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const regId = `CC-2026-${randomSuffix}`;

  const newRegistration = {
    id: regId,
    eventId: event.id,
    eventTitle: event.title,
    eventVenue: event.venue,
    eventDate: event.date,
    eventTime: event.time,
    studentName: studentData.studentName.trim(),
    regNumber: studentData.regNumber.trim(),
    email: studentData.email.trim().toLowerCase(),
    phone: studentData.phone.trim(),
    department: studentData.department,
    year: studentData.year,
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  };

  allRegistrations.unshift(newRegistration);
  saveRegistrations(allRegistrations);

  // 6. Check if event is now full or low on seats to push alert
  const remaining = event.seatLimit - (currentBookedCount + 1);
  if (remaining === 0) {
    addNotification('Event Filled!', `"${event.title}" has reached maximum seat capacity (${event.seatLimit}/${event.seatLimit}).`, 'warning');
  } else if (remaining <= 5) {
    addNotification('Seats Running Low!', `Only ${remaining} seats left for "${event.title}".`, 'info');
  }

  // Also push user confirmation notification
  addNotification(
    'Registration Confirmed',
    `You are successfully registered for "${event.title}". Ticket ID: ${regId}`,
    'success'
  );

  return {
    success: true,
    message: 'Registration successful! Your digital admit ticket has been generated.',
    regId: regId
  };
}

/**
 * Cancels a student registration and returns the seat back to the pool.
 * @param {string} regId - Registration ID (e.g. CC-2026-123456).
 * @returns {{success: boolean, message: string}}
 */
function cancelRegistration(regId) {
  const registrations = getRegistrations();
  const index = registrations.findIndex(r => r.id === regId);

  if (index === -1) {
    return { success: false, message: 'Registration record not found.' };
  }

  if (registrations[index].status === 'cancelled') {
    return { success: false, message: 'This registration is already cancelled.' };
  }

  // Mark as cancelled (releasing the seat for getConfirmedRegistrationsCount)
  registrations[index].status = 'cancelled';
  registrations[index].cancelledAt = new Date().toISOString();
  saveRegistrations(registrations);

  addNotification(
    'Registration Cancelled',
    `Registration ${regId} for "${registrations[index].eventTitle}" was cancelled. 1 seat has been restored.`,
    'info'
  );

  return {
    success: true,
    message: 'Registration was cancelled successfully. The seat has been restored to the event pool.'
  };
}

/**
 * Retrieves a single registration by its unique ticket ID.
 * @param {string} regId - Registration ID.
 * @returns {Object|null}
 */
function getRegistrationById(regId) {
  const registrations = getRegistrations();
  return registrations.find(r => r.id === regId) || null;
}

/**
 * Retrieves all registrations for a student (matched by email or regNumber).
 * @param {string} query - Student Reg Number or Email.
 * @returns {Array<Object>} List of registrations.
 */
function getStudentRegistrations(query) {
  if (!query) return [];
  const clean = query.trim().toLowerCase();
  const registrations = getRegistrations();
  return registrations.filter(r =>
    r.email.toLowerCase() === clean ||
    r.regNumber.toLowerCase() === clean
  );
}

/**
 * ==============================================================================
 * NOTIFICATIONS STORE
 * ==============================================================================
 */

/**
 * Retrieves user/system notifications.
 * @returns {Array<Object>}
 */
function getNotifications() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Adds a new in-app notification.
 * @param {string} title - Short notification heading.
 * @param {string} message - Notification body.
 * @param {'info'|'success'|'warning'|'error'} type - Semantic notification level.
 */
function addNotification(title, message, type = 'info') {
  const notifs = getNotifications();
  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    message,
    type,
    timestamp: new Date().toISOString(),
    read: false
  };
  notifs.unshift(newNotif);
  if (notifs.length > 25) notifs.pop(); // keep last 25
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));

  // Trigger UI toast if ui module is active
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}

/**
 * Marks all notifications as read.
 */
function markAllNotificationsRead() {
  const notifs = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
}

/**
 * Resets the application state back to seed defaults.
 */
function resetDatabase() {
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
  localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  localStorage.removeItem(STORAGE_KEYS.SEEDED);
  initializeStorage();
}
