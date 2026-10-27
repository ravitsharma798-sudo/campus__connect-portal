# 🎓 CampusConnect — University Event Management & Registration Portal

> **A responsive, modern, multi-page web application engineered purely with vanilla HTML5, CSS3, and JavaScript.**
> Zero frameworks, zero build steps, zero external backends — deployable directly on **GitHub Pages** with complete client-side data persistence in `localStorage`.

---

## 🌟 Executive Overview & Purpose

**CampusConnect** solves the chaotic fragmentation of university events (tech fests, workshops, cultural galas, hackathons, and sports tournaments). It delivers:
1. **For Students**: A unified event directory with live seat tracking, 1-click registration, instant digital admit slips with scannable QR codes, and pass cancellation.
2. **For Campus Organizers / Admins**: Real-time analytical dashboard with interactive Chart.js visualizations, event CRUD with live preview cards, seat limit constraints, and one-click CSV attendance roster export.

---

## 🚀 Key Features

### 1. Home Portal (`index.html`)
- **Hero Showcase**: High-impact *"Discover. Register. Participate."* theme with gradient typography.
- **Search Bar**: Quick-access event search passing URL query parameters to the catalog.
- **Live University Metric Strip**: Real-time counts of active events, student passes issued, free entry guarantee, and academic departments.
- **Category Filter Chips**: Instant navigation to Fests, Workshops, Seminars, Competitions, Sports, and Cultural events.
- **Featured Events Grid**: Highlights top campus events with dynamic live seat indicators.
- **"How It Works"**: Intuitive 3-step pictorial workflow.

### 2. Events Directory (`events.html`)
- **Multi-Factor Real-Time Search & Filtering**:
  - Keyword search across Title, Description, Venue, and Organizing Body.
  - Category filter pills with active state tracking.
  - Date horizon filters (*All Dates*, *Upcoming Events*, *Next 7 Days*).
  - Seat availability filter (*All*, *Seats Available*, *Full Only*).
- **Dynamic Sorting**: Date (soonest/latest), Seats left (most/least), and Title (A-Z).
- **Live Seat Indicator**: Color-shifting progress bars:
  - 🟢 **Green (>50% seats remaining)**
  - 🟠 **Orange (15% to 50% seats remaining)**
  - 🔴 **Red (<15% seats remaining or 0 left)**
- **Sold Out State**: Events with 0 seats display a red `FULL` badge and a disabled action button.
- **Empty State**: Friendly fallback with a 1-click "Reset All Filters" trigger.

### 3. Event Details Page (`event-details.html`)
- Dynamic URL param reading (`?id=evt-xxx`).
- Hero banner with image fallback error handler.
- Event description, organizer details, and eligibility criteria card.
- **Agenda Timeline**: Step-by-step program schedule.
- **Sticky Side Action Card**: Live seat counter, deadline countdown timestamp, venue logistics, and 1-click clipboard link sharing.

### 4. Robust Student Registration (`register.html`)
- Pre-filled with logged-in student details.
- **Client-Side Form Validation**:
  - Full Name (minimum 3 characters).
  - University Registration Number (strictly **8 digits**, verified with `/^\d{8}$/`).
  - Academic Email (RFC-compliant regex).
  - Contact Number (strictly **10 digits**, verified with `/^\d{10}$/`).
  - Department and Academic Year dropdowns.
- **Duplicate Registration Prevention**: Blocks attempts by the same student (Reg No. or Email) to register twice for the same event.
- **Tab & Concurrency Safety**: Re-reads localStorage right before saving to guarantee seat capacity cannot be breached even with multiple tabs open.

### 5. Ticket Confirmation & Printable Admit Slip (`confirmation.html`)
- Ticket-style card with perforated visual notch divider.
- Scannable **QR Code** generated dynamically via QRCode.js CDN (encodes verification JSON).
- Unique Registration ID (e.g. `CC-2026-XXXXXX`).
- Print CTA triggering `window.print()` using dedicated `css/print.css`.

### 6. Student Pass Dashboard (`my-registrations.html`)
- Instant lookup using 8-digit Reg Number or Email.
- Confirmed / Cancelled status badges.
- 1-click "View Slip" and "Cancel Seat" modal.
- Cancelling releases the seat immediately back to the university pool.

### 7. Simulated Single-Sign-On Auth (`login.html`)
- Modern split layout (university visual panel + interactive form).
- Role toggle between **Student** and **Admin / Organizer**.
- Tab switching between Sign In and Sign Up.
- Route guards: Automatically redirects unauthorized users trying to access administrative routes.
- Pre-filled one-click demo credentials.

### 8. Admin Analytics Dashboard (`dashboard.html`)
- Route protected (`requireAdmin()`).
- Summary cards: Total Events, Total Registrations, Seats Filled %, Upcoming Events.
- **Interactive Chart.js Visualizations**:
  1. *Registrations vs Capacity* (Bar Chart)
  2. *Event Distribution by Category* (Donut Chart)
- Recent events status table.

### 9. Event Management & Live Preview (`manage-events.html`)
- Author, edit, or delete events.
- **Live Preview Card**: Updates in real-time as the organizer types title, date, venue, category, or banner URL.
- **Capacity Integrity Guard**: Seat capacity cannot be lowered below current active registrations.

### 10. Participants Roster & CSV Export (`participants.html`)
- Filter attendees by specific event or all events.
- Instant search by student name, registration number, email, or department.
- **One-Click CSV Export**: Generates and downloads a clean RFC-4180 CSV file.

---

## 📁 Folder Structure

```
campusconnect/
├── index.html               # Public Homepage & featured showcase
├── events.html              # Filterable events catalog with live seat counters
├── event-details.html       # Full event breakdown, agenda timeline & sticky sidebar
├── register.html            # Validated registration form with concurrency locks
├── confirmation.html        # Perforated admit pass with QR Code & print triggers
├── my-registrations.html    # Student passes directory & seat cancellation
├── login.html               # Split-screen role authentication (Student / Admin)
├── dashboard.html           # Admin analytics with Chart.js bar & donut graphs
├── manage-events.html       # Event CRUD management with live card preview
├── participants.html        # Attendees table with instant CSV export
├── css/
│   ├── style.css            # Complete design system, tokens, flexbox/grid layouts
│   └── print.css            # Dedicated print stylesheet for clean ticket printing
├── js/
│   ├── storage.js           # Repository layer, seed data, concurrency & atomic checks
│   ├── auth.js              # Session manager, role verification, and route guards
│   ├── events.js            # Event search, multi-filter pipeline, and detail view
│   ├── registration.js      # Form validation, QR code rendering, and seat release
│   ├── dashboard.js         # Chart.js charts, live preview card, and CSV generator
│   └── ui.js                # Dynamic navbar/drawer, modals, toasts, progress bars
├── assets/
│   └── logo.svg             # Vector brand icon
└── README.md                # Project documentation & viva guide
```

---

## 🧪 Demo Credentials

The portal is pre-loaded with realistic seed events and test accounts:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin / Organizer** | `admin@campus.com` | `admin123` | Dr. Evelyn Reed (Dean of Engineering) |
| **Student** | `student@campus.com` | `student123` | Alex Rivera (Reg: `20241088`, CSE, 3rd Year) |

> 💡 **Tip**: On `login.html`, click the **"Demo Student"** or **"Demo Admin"** buttons to auto-populate credentials instantly.

---

## 💻 How to Run Locally

Because CampusConnect uses standard vanilla web technologies and relative links without build steps, it can be run using any static file server:

### Option A: Using Python (Recommended)
Open PowerShell or Terminal in the `campusconnect` folder and run:
```bash
python -m http.server 8000
```
Then visit: [`http://localhost:8000`](http://localhost:8000)

### Option B: Using VS Code Live Server
1. Open the `campusconnect/` folder in Visual Studio Code.
2. Right-click `index.html` and click **"Open with Live Server"**.

### Option C: Direct Browser Opening
You can double-click `index.html` directly to open it in Google Chrome, Microsoft Edge, Firefox, or Safari!

---

## 🌐 How to Deploy to GitHub Pages

1. Create a new repository on GitHub named `campusconnect`.
2. Push or upload all files from the `campusconnect` folder to the repository's `main` branch.
3. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Under **Branch**, select `main` and root folder `/ (root)`.
   - Click **Save**.
4. Within 1-2 minutes, your live website will be accessible at:
   `https://<your-username>.github.io/campusconnect/`
5. All relative asset paths and links (`href="events.html"`, `src="js/storage.js"`) will work out of the box!

---

## 🎓 University Viva / Oral Examination Guide

### Q1: How does the application store data without a backend server or database?
> **Answer**: Data persistence is achieved using the HTML5 `localStorage` Web API. The `storage.js` module acts as a Client-Side Repository. JavaScript objects are serialized into JSON strings via `JSON.stringify()` when writing, and parsed back into memory using `JSON.parse()`. Storage is persistent across browser restarts and page refreshes.

### Q2: How does the system handle concurrency and race conditions (e.g., two tabs booking the last seat)?
> **Answer**: In `registerStudent()` inside `js/storage.js`, the code does not rely on cached in-memory variables. Instead, it reads the latest snapshot from `localStorage` synchronously immediately before validating seat limits. If another tab secured the final seat a millisecond prior, the capacity check detects that `booked >= seatLimit` and cleanly rejects the second transaction with an explanatory error notice.

### Q3: How is duplicate student registration prevented?
> **Answer**: `registerStudent()` inspects all active confirmed registrations for that specific `eventId`. It checks if either the student's normalized registration number or email address matches an existing confirmed pass. If a match is found, registration is blocked.

### Q4: Why are relative links used throughout the code?
> **Answer**: Relative paths (such as `href="events.html"` instead of `href="/events.html"`) allow the website to operate regardless of the domain sub-path. When deployed on GitHub Pages, the project resides under `https://username.github.io/campusconnect/`. Absolute paths with leading slashes would break by attempting to load from the root domain `https://username.github.io/`, whereas relative paths resolve within the repository directory.

### Q5: How are the Chart.js graphs rendered without memory leaks?
> **Answer**: The Chart.js library renders to HTML5 `<canvas>` elements. When switching filters or updating metrics, the existing Chart instances stored in `window.myBarChart` and `window.myDonutChart` are checked. If they exist, `.destroy()` is invoked before initializing a new `Chart()` instance, freeing up memory and preventing tooltip glitches.

### Q6: How does CSV attendee export work in vanilla JavaScript?
> **Answer**: In `participants.html` / `dashboard.js`, participant objects are mapped into standard comma-separated values conforming to RFC-4180. A binary `Blob` with MIME type `text/csv;charset=utf-8;` is constructed. Using `URL.createObjectURL(blob)`, an ephemeral object URL is assigned to a hidden `<a>` element with a `download` attribute, and `.click()` is invoked programmatically to trigger the download.

---

## 📋 Technology Stack
- **Structure**: Semantic HTML5 (Cards, Details, Nav, Modals, Forms)
- **Styling**: Vanilla CSS3 (Custom Properties/Variables, Flexbox, CSS Grid, Responsive Breakpoints)
- **Behavior**: Vanilla Modern JavaScript (ES6+ Modules, Array methods, Regex, Web Storage API, Canvas API)
- **External CDNs**:
  - *Google Fonts*: Inter & Poppins typography
  - *Chart.js 3.9.1*: Analytics visualizations
  - *QRCode.js 1.0.0*: Client-side 2D barcode generation

---

*Crafted for university event operations and collegiate excellence.*
