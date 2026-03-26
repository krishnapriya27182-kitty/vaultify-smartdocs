# Vaultify SmartDocs — Complete Project Notes
# Written clearly so anyone can understand, even without coding experience.

---

## PART 1 — WHAT IS THIS PROJECT AND WHY DID WE BUILD IT?

### The Problem
Imagine you have important documents — your passport, your college certificates,
your health insurance, your driving licence. These documents have expiry dates.
If your passport expires and you don't notice, you can't travel. If your insurance
expires, you are not covered. Most people keep these documents in physical folders
or scattered across their computer, and they forget about them until it is too late.

### The Solution — Vaultify SmartDocs
We built a web application (a website you can use in any browser) where:
- Every person creates their own private account
- They can upload their important documents (PDF, images, etc.)
- The app tracks expiry dates and warns them before something expires
- They can search, filter, edit, and delete their documents anytime
- Everything is stored safely in the cloud — accessible from anywhere

### Who is it for?
- Students tracking their certificates and ID proofs
- Professionals managing work permits and licences
- Anyone who wants to organize their personal documents digitally

### The Main Goal
One sentence: "A secure personal digital vault where you never miss a document expiry again."

---

## PART 2 — THE BIG PICTURE (HOW EVERYTHING CONNECTS)

Think of the project like a restaurant:

```
CUSTOMER (You, using a browser)
        |
        | types in the website address
        v
WAITER (Frontend — HTML, CSS, JavaScript)
        |
        | sends your order to the kitchen
        v
KITCHEN (Backend — Node.js + Express)
        |
        | stores and retrieves food ingredients
        v
STORAGE (Database — MongoDB Atlas in the cloud)
```

In our project:
- The CUSTOMER is you, opening the website in Chrome or any browser
- The WAITER is the frontend — the pages you see and click on
- The KITCHEN is the backend — the server that processes everything
- The STORAGE is MongoDB Atlas — where all data is saved permanently

### The Full Workflow Diagram

```
YOUR COMPUTER
┌─────────────────────────────────────────┐
│  Local Git Repository                   │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  Frontend   │  │    Backend       │  │
│  │  HTML/CSS/JS│  │  Node.js/Express │  │
│  └─────────────┘  └──────────────────┘  │
│              │                          │
│              ▼                          │
│       MongoDB Atlas (cloud DB)          │
└─────────────────────────────────────────┘
        │
        │  git push
        ▼
┌─────────────────┐
│     GitHub      │  (stores your code online)
└─────────────────┘
        │
        │  triggers automatically
        ▼
┌─────────────────────────────────────────┐
│   CI/CD — GitHub Actions                │
│   - Installs packages (npm install)     │
│   - Checks code quality (ESLint)        │
│   - Runs tests (node tests/run-tests.js)│
└─────────────────────────────────────────┘
        │
        │  if all pass
        ▼
┌─────────────────────────────────────────┐
│   Render.com (Hosting)                  │
│   - Runs your Node.js server            │
│   - Serves your website publicly        │
│   - Connected to MongoDB Atlas          │
│   - Has a public URL (Domain + DNS)     │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│   Web Browser   │  (anyone in the world can visit)
└─────────────────┘
```

---

## PART 3 — PROJECT FOLDER STRUCTURE EXPLAINED

```
vaultify-smartdocs/
│
├── public/                  ← FRONTEND (what the user sees in the browser)
│   ├── index.html           ← Sign In page
│   ├── signup.html          ← Sign Up page
│   ├── dashboard.html       ← Main app page
│   ├── settings.html        ← Account settings page
│   ├── common.js            ← Shared JavaScript used by all pages
│   ├── login.js             ← JavaScript only for the Sign In page
│   ├── signup.js            ← JavaScript only for the Sign Up page
│   ├── dashboard.js         ← JavaScript only for the Dashboard page
│   ├── settings.js          ← JavaScript only for the Settings page
│   ├── styles.css           ← Main CSS file (imports all style files)
│   └── styles/
│       ├── base.css         ← Fonts, colors, basic rules
│       ├── layout.css       ← Buttons, forms, panels, modals
│       ├── app.css          ← Dashboard and settings specific styles
│       └── responsive.css   ← Makes the site work on mobile/tablet
│
├── src/                     ← BACKEND (the server, hidden from users)
│   ├── app.js               ← Sets up Express, connects all routes
│   ├── config/
│   │   └── constants.js     ← All settings in one place (port, DB URL, etc.)
│   ├── middleware/
│   │   ├── requireAuth.js   ← Checks if user is logged in before allowing access
│   │   └── upload.js        ← Handles file uploads (using Multer)
│   ├── models/
│   │   ├── User.js          ← Defines what a User looks like in the database
│   │   └── Document.js      ← Defines what a Document looks like in the database
│   ├── routes/
│   │   ├── authRoutes.js    ← Login, signup, password reset endpoints
│   │   ├── documentRoutes.js← Create, read, update, delete documents
│   │   ├── accountRoutes.js ← Update account settings
│   │   └── notificationRoutes.js ← Get smart alerts
│   ├── services/
│   │   ├── storageService.js    ← Handles file storage in MongoDB GridFS
│   │   └── notificationService.js ← Builds expiry and storage alerts
│   └── utils/
│       └── authHelpers.js   ← Helper functions for tokens, emails, passwords
│
├── tests/
│   └── run-tests.js         ← Automated tests to verify the app works
│
├── .github/workflows/       ← CI/CD pipeline instructions for GitHub
│   ├── build.yml            ← Runs on every push: install + lint + test
│   ├── ci.yml               ← Continuous integration checks
│   ├── deploy-render.yml    ← Deploys to Render (manual trigger)
│   └── ftp-deploy.yml       ← FTP upload option
│
├── .circleci/config.yml     ← CircleCI pipeline (alternative CI/CD)
├── docker-compose.yml       ← Runs a local MongoDB using Docker
├── server.js                ← Entry point — starts the whole application
├── package.json             ← Lists all packages and scripts
├── .env                     ← Secret settings (NOT uploaded to GitHub)
├── .env.example             ← Template showing what .env should contain
├── render.yaml              ← Render deployment configuration
├── DNS.md                   ← Instructions for custom domain setup
└── README.md                ← Project overview and setup instructions
```

---

## PART 4 — FRONTEND EXPLAINED (What the User Sees)

The frontend is everything inside the `public/` folder.
It is made of three technologies:
- HTML — the structure (like the skeleton of a body)
- CSS — the styling (like the clothes and appearance)
- JavaScript — the behaviour (like the muscles that make things move)

### Why "Frontend"?
Because it runs in the user's browser — on the FRONT, facing the user.
The user can see and interact with it directly.

---

### PAGE 1 — index.html (Sign In Page)

This is the first page a user sees when they visit the website.

What it contains:
- Left side: Brand panel with the Vaultify logo, a headline, and 3 feature cards
  explaining what the app does (Private Access, Password Security, Smart Alerts)
- Right side: A form with Email and Password fields, a "Sign In" button,
  and a "Forgot Password?" link

What happens when you click Sign In:
1. The browser collects your email and password
2. It sends them to the backend at `/api/auth/login`
3. The backend checks if the email and password are correct
4. If correct, it sends back a "token" (like a key card)
5. The browser saves this token in localStorage (a small storage in the browser)
6. The browser redirects you to dashboard.html

The Forgot Password flow:
1. A popup (modal) appears asking for your email
2. The backend generates a 6-digit reset code
3. You enter the code + new password
4. The backend verifies the code and updates your password

---

### PAGE 2 — signup.html (Sign Up Page)

This is where new users create their account.

What it contains:
- Left side: Same brand panel as login but with different text
- Right side: A form with Full Name, Email, Recovery Email (optional),
  Password, Confirm Password, and a checkbox for email notifications

What happens when you click Create Account:
1. The browser sends all your details to `/api/auth/signup`
2. The backend validates everything (checks email format, password length, etc.)
3. If valid, it creates a new User in MongoDB
4. It sends back a token
5. The browser saves the token and redirects to dashboard.html

---

### PAGE 3 — dashboard.html (Main App Page)

This is the heart of the application. Everything happens here.

What it contains:

TOP SECTION — Dark green header showing:
- "Welcome, [Your Name]"
- Your initials avatar and email

METRICS STRIP — 4 cards showing:
- Total Documents (how many you have uploaded)
- Expiring Soon (documents expiring within 30 days)
- Categories Used (how many different categories you have)
- Storage Used (how much space you have used out of 30 MB)

LEFT COLUMN — Document management:
- Smart Alerts panel (shows warnings about expiring documents)
- Search bar (search by title, description, or tag)
- Category filter dropdown
- Status filter dropdown (Active, Expiring Soon, Expired, No Expiry)
- Sort filter (by date, name, expiry, last updated)
- Document cards grid (each card shows one document)

RIGHT COLUMN — Two panels stacked:
1. Quick Preview panel — click any document card to see its details here
2. Upload/Edit Form — drag and drop or select a file, fill in details, save

DELETE MODAL — A popup that asks "Are you sure?" before deleting

---

### PAGE 4 — settings.html (Account Settings Page)

This is where users manage their profile.

What it contains:
- Dark green header with your name and initials
- Profile Details form: Full Name, Email (read-only), Recovery Email,
  Email Notifications checkbox, Change Password button, Save Changes button
- Storage Card: Shows how much storage you have used with a progress bar
- Security section: Information about password reset and vault protection

---

### common.js — The Shared Brain

This file is loaded on EVERY page. It contains functions that all pages need.

Key functions explained:

`getToken()` — Gets your login token from browser storage.
Think of it like getting your ID card from your wallet.

`setSession(token, user)` — Saves your token and user info after login.
Like putting your ID card and name badge in your wallet.

`clearSession()` — Removes your token when you log out.
Like throwing away your ID card when you leave.

`apiFetch(url, options)` — Sends requests to the backend.
This is the messenger. Every time the frontend needs data from the backend,
it uses this function. It automatically adds your token to every request
so the backend knows who you are.

`showMessage(message, type)` — Shows a toast notification (the small popup
at the top right that says "Document saved" or "Error occurred").

`requireAuth()` — If you are not logged in and try to visit the dashboard,
this function sends you back to the login page.

`redirectIfAuthenticated()` — If you ARE logged in and try to visit the
login page, this sends you to the dashboard instead.

`attachScrollButtons()` — Makes the sidebar buttons scroll smoothly to
the correct section on the page when clicked.

`getInitials(name)` — Takes "Krishna Priya" and returns "KP" for the avatar.

`formatDate(dateString)` — Converts "2024-12-15T00:00:00Z" to "15 Dec 2024".

`formatBytes(size)` — Converts 1048576 (bytes) to "1.0 MB".

---

### Why do we use localStorage?
localStorage is a small storage area inside every browser.
We store the login token there so the user stays logged in even if they
refresh the page or close and reopen the browser tab.
It is like a sticky note on your browser that says "this person is logged in."

---

## PART 5 — BACKEND EXPLAINED (The Server, Hidden from Users)

The backend is everything inside the `src/` folder plus `server.js`.
It runs on the SERVER — a computer in the cloud (Render.com).
Users never see this code directly. They only see the results it sends back.

### Why Node.js?
Node.js lets us write server-side code using JavaScript — the same language
we use for the frontend. This means we only need to know one language for
the whole project. Node.js is also very fast at handling many requests at once.

### Why Express.js?
Express is a framework built on top of Node.js. Without Express, writing a
server would require a lot of complex code. Express makes it simple.
Think of Node.js as a car engine, and Express as the steering wheel and pedals
that make it easy to drive.

---

### server.js — The Entry Point

This is the FIRST file that runs when you start the application.

```
node server.js
```

What it does step by step:
1. Connects to MongoDB Atlas using the URI from .env
2. Waits up to 15 seconds for the connection
3. If connected successfully → starts the web server on port 3000
4. If connection fails → prints an error and stops

Why do we connect to the database BEFORE starting the server?
Because if the database is not available, the app cannot work at all.
There is no point accepting user requests if we cannot save or read data.

---

### src/app.js — The Express Application Setup

This file creates the Express application and connects all the pieces.

`app.use(express.json())` — Tells Express to understand JSON data.
When the frontend sends data like `{"email": "test@test.com"}`, this line
makes Express able to read it.

`app.use(express.urlencoded({ extended: true }))` — Understands form data.

`app.use(express.static(PUBLIC_DIR))` — Serves all files in the `public/`
folder directly. This is how the browser gets the HTML, CSS, and JS files.
When you visit `http://localhost:3000`, Express automatically sends `index.html`.

Route mounting:
- `/api/auth` → authRoutes.js (login, signup, password reset)
- `/api/account` → accountRoutes.js (update profile)
- `/api/notifications` → notificationRoutes.js (get alerts)
- `/api/documents` → documentRoutes.js (CRUD for documents)

The error handler at the bottom catches any file-too-large errors from Multer
and sends a friendly message instead of crashing.

---

### src/config/constants.js — All Settings in One Place

Instead of writing the same values (like port number, database URL) in many
different files, we put them all here. Then every other file imports from here.

Why? If you need to change the port number, you change it in ONE place,
not in 10 different files. This is called the DRY principle:
"Don't Repeat Yourself."

Key constants:
- `PORT` — which port the server listens on (default 3000)
- `HOST` — "0.0.0.0" means accept connections from any IP address
- `MONGODB_URI` — the address of the MongoDB database
- `MAX_FILE_SIZE_MB` — maximum file size users can upload (10 MB)
- `DEFAULT_STORAGE_LIMIT_BYTES` — each user gets 30 MB of storage
- `PUBLIC_DIR` — the path to the public folder

`process.env.PORT` means "read the PORT value from the environment variables."
On Render.com, they set PORT automatically. Locally, we use 3000.

---

### src/middleware/requireAuth.js — The Security Guard

Middleware is code that runs BETWEEN receiving a request and sending a response.
Think of it like a security guard at a door — before you can enter, you must
show your ID.

How it works:
1. Every request to a protected route comes with a header:
   `Authorization: Bearer abc123xyz...`
2. requireAuth extracts the token (`abc123xyz...`)
3. It hashes the token using SHA-256 (converts it to a fixed-length code)
4. It searches MongoDB for a user who has that hash in their sessions array
5. If found → attaches the user to `req.user` and lets the request continue
6. If not found → sends back 401 (Unauthorized) error

Why do we hash the token before storing it?
Security. If someone hacks the database and sees the sessions, they only see
hashed values — not the actual tokens. They cannot use a hash to log in.

---

### src/middleware/upload.js — The File Handler

This uses a package called Multer to handle file uploads.

`multer.memoryStorage()` — Stores the uploaded file in RAM (memory) temporarily,
not on the hard drive. We do this because we immediately send the file to
MongoDB GridFS. There is no need to save it to disk first.

`limits: { fileSize: MAX_FILE_SIZE_BYTES }` — Rejects files larger than 10 MB.
If someone tries to upload a 50 MB video, Multer stops it immediately.

---

## PART 6 — DATABASE MODELS EXPLAINED

A "model" is a blueprint that defines what data looks like in the database.
Think of it like a form with specific fields — you cannot put data in fields
that do not exist on the form.

We use Mongoose, which is a library that makes it easy to define these
blueprints and interact with MongoDB.

---

### src/models/User.js — The User Blueprint

Every person who creates an account gets one User document in MongoDB.

Fields stored for each user:

```
fullName              → "Krishna Priya"
email                 → "krishna@example.com" (unique, always lowercase)
recoveryEmail         → "backup@example.com" (optional)
emailNotificationsEnabled → true or false
storageLimitBytes     → 31457280 (30 MB in bytes)
storageUsedBytes      → 5242880 (how much they have used so far)
passwordHash          → "a3f8c2..." (the password, scrambled for security)
passwordSalt          → "b7d9e1..." (random value used in scrambling)
sessions              → [ { tokenHash: "...", createdAt: Date } ]
passwordResetCodeHash → "c4a2f9..." (temporary, only when resetting password)
passwordResetExpiresAt → Date (when the reset code expires)
```

Why do we NOT store the password directly?
NEVER store passwords as plain text. If the database is hacked, all passwords
would be exposed. Instead we use a process called "hashing":

1. Generate a random "salt" (random string like "b7d9e1...")
2. Combine the password + salt and run it through scrypt algorithm
3. Store only the result (the hash)
4. When user logs in, do the same process and compare the results

Even if someone steals the database, they cannot reverse a hash back to
the original password.

The `sessions` array stores one entry per active login.
Each entry has a hashed version of the session token.
A user can be logged in from multiple devices at once (up to 5 sessions).

The `toJSON transform` at the bottom automatically removes sensitive fields
(passwordHash, passwordSalt, sessions, etc.) whenever a User is converted
to JSON to send to the frontend. The frontend never sees these fields.

---

### src/models/Document.js — The Document Blueprint

Every file a user uploads creates one Document record in MongoDB.

Fields stored for each document:

```
owner         → ObjectId pointing to the User who owns this document
title         → "International Passport"
category      → "ID Proof"
description   → "My personal passport for international travel"
expiryDate    → 2024-12-15 (or null if no expiry)
tags          → ["travel", "official", "biometric"]
fileName      → "passport.pdf"
gridFsFileId  → ObjectId pointing to the actual file in GridFS
fileType      → "application/pdf"
fileSize      → 2457600 (in bytes)
createdAt     → automatically set by MongoDB
updatedAt     → automatically updated by MongoDB
```

The `getExpiryStatus()` method calculates the status dynamically:
- No expiry date → "no-expiry"
- Expiry date is in the past → "expired"
- Expiry date is within 30 days → "expiring-soon"
- Expiry date is more than 30 days away → "active"

The `toJSON transform` adds `expiryStatus` and `downloadUrl` automatically
whenever a document is sent to the frontend. It also removes `gridFsFileId`
(the frontend does not need to know the internal file storage ID).

Why is `owner` stored as an ObjectId?
This links each document to exactly one user. When we fetch documents,
we always filter by `owner: req.user._id` — so users can ONLY see their
own documents, never someone else's.

---

## PART 7 — HOW DATA IS STORED (The Database Diagram)

### MongoDB Atlas — What is it?

MongoDB is a "NoSQL" database. Instead of tables with rows and columns
(like Excel), it stores data as "documents" — which look like JSON objects.

MongoDB Atlas is the cloud-hosted version. Your data lives on servers in
AWS Mumbai (ap-south-1 region), managed by MongoDB.

### Collections in our database

A "collection" is like a folder. We have three:

```
MongoDB Atlas — vaultify-smartdocs database
│
├── users collection
│   └── { _id, fullName, email, passwordHash, sessions, ... }
│   └── { _id, fullName, email, passwordHash, sessions, ... }
│   └── ...
│
├── documents collection
│   └── { _id, owner, title, category, fileName, gridFsFileId, ... }
│   └── { _id, owner, title, category, fileName, gridFsFileId, ... }
│   └── ...
│
└── documentFiles.files + documentFiles.chunks  (GridFS)
    └── This is where the actual file bytes are stored
    └── Large files are split into 255KB chunks automatically
```

### What is GridFS?

GridFS is MongoDB's way of storing large files.
MongoDB documents have a 16 MB size limit. But files can be bigger.
GridFS splits files into small chunks (255 KB each) and stores them
in two collections:
- `documentFiles.files` — metadata (filename, size, upload date)
- `documentFiles.chunks` — the actual binary data in pieces

When you download a file, GridFS reassembles the chunks in order
and streams them back to you.

### The Complete Data Flow Diagram

```
USER UPLOADS A DOCUMENT
─────────────────────────────────────────────────────────────

Browser                    Backend                  MongoDB Atlas
  │                           │                          │
  │  POST /api/documents       │                          │
  │  (FormData with file)      │                          │
  │──────────────────────────>│                          │
  │                           │                          │
  │                    1. requireAuth checks token        │
  │                           │──────────────────────────>│
  │                           │  find user by tokenHash   │
  │                           │<──────────────────────────│
  │                           │                          │
  │                    2. Multer reads file into memory   │
  │                           │                          │
  │                    3. Check storage limit             │
  │                           │──────────────────────────>│
  │                           │  aggregate fileSize sum   │
  │                           │<──────────────────────────│
  │                           │                          │
  │                    4. Upload file to GridFS           │
  │                           │──────────────────────────>│
  │                           │  write chunks to DB       │
  │                           │<── returns gridFsFileId ──│
  │                           │                          │
  │                    5. Create Document record          │
  │                           │──────────────────────────>│
  │                           │  insert into documents    │
  │                           │<── returns document ──────│
  │                           │                          │
  │                    6. Update user storageUsedBytes    │
  │                           │──────────────────────────>│
  │                           │  update user record       │
  │                           │<──────────────────────────│
  │                           │                          │
  │<── 201 Created (document JSON) ──────────────────────│
  │                           │                          │
  Dashboard refreshes and shows the new document card
```

```
USER VIEWS A FILE
─────────────────────────────────────────────────────────────

Browser                    Backend                  MongoDB Atlas
  │                           │                          │
  │  GET /api/documents/:id/file                         │
  │──────────────────────────>│                          │
  │                           │                          │
  │                    1. requireAuth checks token        │
  │                    2. Find document by _id + owner    │
  │                           │──────────────────────────>│
  │                           │<── document record ───────│
  │                           │                          │
  │                    3. Open GridFS download stream     │
  │                           │──────────────────────────>│
  │                           │  read chunks in order     │
  │<══ file bytes stream ══════│<══════════════════════════│
  │                           │                          │
  Browser opens the file in a new tab
```

---

## PART 8 — API ROUTES EXPLAINED (The Backend Endpoints)

An "API endpoint" is a URL that the frontend can send requests to.
Think of each endpoint as a specific window at a bank counter —
each window handles a different type of request.

### Authentication Routes — /api/auth/...

#### POST /api/auth/signup
Purpose: Create a new user account
Input: fullName, email, password, confirmPassword, recoveryEmail, emailNotificationsEnabled
Process:
  1. Validate all fields (name not empty, email format valid, password ≥ 8 chars)
  2. Check if email already exists in database
  3. Hash the password with a random salt
  4. Generate a session token (64 random bytes as hex string)
  5. Hash the token and store it in user.sessions
  6. Save the new user to MongoDB
  7. Return the token + user info to the browser
Output: { token: "abc...", user: { _id, fullName, email, ... } }

#### POST /api/auth/login
Purpose: Sign in an existing user
Input: email, password
Process:
  1. Find user by email in database
  2. Hash the provided password with the stored salt
  3. Compare with stored hash using timingSafeEqual (prevents timing attacks)
  4. If match → generate new session token, add to sessions array
  5. Keep only the last 5 sessions (removes oldest if more than 5)
  6. Sync storage usage
  7. Return token + user info
Output: { token: "abc...", user: { ... } }

#### POST /api/auth/forgot-password
Purpose: Start the password reset process
Input: email
Process:
  1. Find user by email
  2. Generate a random 6-digit code (e.g., 847291)
  3. Hash the code and store it with an expiry time (15 minutes)
  4. Return the code (in a real app, this would be emailed — here it is shown
     directly for demonstration purposes)
Output: { demoResetCode: "847291", expiresInMinutes: 15, email: "..." }

#### POST /api/auth/reset-password
Purpose: Set a new password using the reset code
Input: email, resetCode, newPassword, confirmPassword
Process:
  1. Find user by email
  2. Hash the provided resetCode and compare with stored hash
  3. Check the code has not expired
  4. Validate new password (≥ 8 chars, matches confirm)
  5. Hash and store the new password
  6. Clear the reset code from the database
  7. Generate a new session token (user is now logged in)
Output: { token: "abc...", user: { ... } }

#### GET /api/auth/me (requires login)
Purpose: Get the current user's latest data
Process: Sync storage usage, return user info
Output: { user: { ... } }

#### POST /api/auth/logout (requires login)
Purpose: Sign out
Process: Remove the current session token from user.sessions array
Output: { message: "Logged out successfully." }

---

### Document Routes — /api/documents/...

All document routes require the user to be logged in (requireAuth middleware).

#### GET /api/documents
Purpose: Get all documents for the logged-in user
Query params: search, category, status
Process:
  1. Build a MongoDB query filtering by owner = current user
  2. If search provided → use $regex to search title, description, tags
  3. If category provided → filter by category
  4. Fetch and sort by newest first
  5. If status filter → filter results by expiryStatus
Output: Array of document objects

#### GET /api/documents/:id
Purpose: Get one specific document
Process: Find document where _id matches AND owner matches current user
Output: Single document object

#### GET /api/documents/:id/file
Purpose: Stream the actual file to the browser
Process:
  1. Find the document record
  2. Open a GridFS download stream using gridFsFileId
  3. Set Content-Type header (so browser knows if it is PDF, image, etc.)
  4. Pipe the stream directly to the response
Output: Binary file data (the actual PDF or image)

#### POST /api/documents (CREATE)
Purpose: Upload a new document
Input: FormData with file + title, category, description, expiryDate, tags
Process:
  1. Check file was provided
  2. Check storage limit not exceeded
  3. Upload file buffer to GridFS → get back a gridFsFileId
  4. Create Document record in MongoDB with all metadata
  5. Update user's storageUsedBytes
Output: The new document object

#### PUT /api/documents/:id (UPDATE)
Purpose: Edit an existing document
Input: FormData with optional new file + updated fields
Process:
  1. Find the document (must belong to current user)
  2. Update text fields (title, category, description, expiryDate, tags)
  3. If new file provided → upload to GridFS, delete old file, update file fields
  4. Save updated document
Output: The updated document object

#### DELETE /api/documents/:id (DELETE)
Purpose: Permanently delete a document and its file
Process:
  1. Find the document (must belong to current user)
  2. Delete the file from GridFS
  3. Delete the document record from MongoDB
  4. Subtract file size from user's storageUsedBytes
Output: { message: "Document deleted successfully." }

---

### Account Routes — /api/account/...

#### PUT /api/account (requires login)
Purpose: Update profile settings
Input: fullName, recoveryEmail, emailNotificationsEnabled
Process: Update the user record in MongoDB
Output: { user: { updated user data } }

---

### Notification Routes — /api/notifications/...

#### GET /api/notifications (requires login)
Purpose: Get smart alerts for the current user
Process:
  1. Sync storage usage
  2. Call buildNotificationsForUser() which:
     - Checks if storage is over 85% or 100% → storage warning
     - Loops through all documents with expiry dates
     - If expired → danger alert
     - If expiring within 30 days → warning alert
  3. Returns up to 8 notifications
Output: { notifications: [...], unreadCount: 5 }

---

## PART 9 — SERVICES EXPLAINED

Services are helper files that contain complex logic used by multiple routes.
Instead of writing the same code in every route file, we put it in a service
and import it wherever needed.

---

### src/services/storageService.js

This service handles everything related to file storage.

`uploadBufferToGridFs(file, ownerId)`
Takes the file that Multer loaded into memory and saves it to MongoDB GridFS.
Returns the gridFsFileId (the ID of the stored file).
Uses a Promise because GridFS uses streams (asynchronous operations).

`deleteGridFsFile(fileId)`
Deletes a file from GridFS by its ID.
Handles the case where the file does not exist gracefully (no crash).

`deleteStoredFile(document)`
Deletes the file associated with a document record.
Called when a document is deleted or when a file is replaced during update.

`streamStoredFile(document, res)`
Opens a GridFS download stream and pipes it directly to the HTTP response.
This means the file is sent to the browser in chunks as it is read from the
database — it does not need to be fully loaded into memory first.
This is efficient for large files.

`syncUserStorageUsage(user)`
Uses MongoDB aggregation to add up the fileSize of all documents owned by
the user. Updates user.storageUsedBytes with the accurate total.
Called after every upload, delete, and on login to keep the number accurate.

`calculateUserStorageUsage(userId)`
The actual aggregation query:
```
db.documents.aggregate([
  { $match: { owner: userId } },
  { $group: { _id: null, totalSize: { $sum: "$fileSize" } } }
])
```
This is like asking: "Add up the fileSize field for all documents where
owner equals this userId."

---

### src/services/notificationService.js

`buildNotificationsForUser(user)`
Fetches all documents for the user and builds a list of alerts.

Storage alerts:
- If storageUsedBytes / storageLimitBytes >= 1.0 → "Storage limit reached" (danger)
- If ratio >= 0.85 → "Storage almost full" (warning)

Document expiry alerts:
- For each document with an expiryDate:
  - Calculate diffDays = (expiryDate - today) in days
  - If diffDays < 0 → document has already expired (danger)
  - If diffDays <= 30 → document is expiring soon (warning)

Returns maximum 8 notifications (to avoid overwhelming the user).

---

### src/utils/authHelpers.js

Small utility functions used across multiple files.

`generateSessionToken()`
Creates a cryptographically secure random token (64 hex characters).
This is what gets stored in localStorage as the user's "key card."
`crypto.randomBytes(32)` generates 32 random bytes → 64 hex characters.

`createTokenHash(token)`
Converts the token to a SHA-256 hash before storing in the database.
SHA-256 is a one-way function — you cannot reverse it.
So even if someone reads the database, they cannot get the original token.

`normalizeEmail(email)`
Converts "  Krishna@EXAMPLE.COM  " to "krishna@example.com"
(trims spaces, converts to lowercase)
This ensures "Krishna@example.com" and "krishna@example.com" are treated
as the same email address.

`isValidEmail(email)`
Checks if the email matches the pattern: something@something.something
Uses a regular expression (regex) to validate.

`createUserPayload(user, defaultStorageLimitBytes)`
Creates a safe object to send to the frontend.
Only includes fields the frontend needs — never includes passwordHash,
sessions, or other sensitive data.

`parseBoolean(value, defaultValue)`
Converts various representations of true/false to an actual boolean.
"true", true, 1 → true
"false", "0", "no" → false
undefined → uses defaultValue

---

## PART 10 — NODE MODULES EXPLAINED

`node_modules/` is a folder that contains all the external packages
(libraries written by other developers) that our project uses.

We NEVER upload this folder to GitHub (it is in .gitignore) because:
1. It can be hundreds of MB in size
2. Anyone can recreate it by running `npm install`

### package.json — The Shopping List

This file lists all the packages our project needs.

```json
"dependencies": {
  "express": "^4.21.2",    ← The web server framework
  "mongoose": "^8.12.1",   ← MongoDB connection and models
  "multer": "^1.4.5-lts.1" ← File upload handling
},
"devDependencies": {
  "eslint": "^8.57.1",     ← Code quality checker
  "nodemon": "^3.1.9"      ← Auto-restarts server when files change
}
```

`dependencies` — needed to RUN the app
`devDependencies` — only needed during DEVELOPMENT, not in production

### Why each package:

**express** — Without this, we would need to write hundreds of lines of
low-level Node.js code to handle HTTP requests. Express makes it simple.

**mongoose** — Without this, we would need to write raw MongoDB queries.
Mongoose gives us schemas (blueprints), validation, and a clean API.

**multer** — Handles multipart/form-data (the format used when uploading files).
Without this, parsing file uploads would be extremely complex.

**eslint** — Reads our code and finds mistakes, bad practices, and style issues.
Like a spell-checker but for code. Our CI/CD pipeline runs this automatically.

**nodemon** — During development, every time you save a file, nodemon
automatically restarts the server. Without it, you would need to manually
stop and restart the server after every change.

---

## PART 11 — ENVIRONMENT VARIABLES AND .env FILE

### What is an environment variable?
It is a setting that lives OUTSIDE the code. Different environments
(your laptop, the Render server) can have different values.

### The .env file
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/vaultify-smartdocs
PORT=3000
RESET_CODE_EXPIRY_MINUTES=15
MAX_FILE_SIZE_MB=10
```

Why do we NOT commit .env to GitHub?
Because it contains secrets (database password). If it was on GitHub,
anyone could see it and access your database.

The `.gitignore` file tells Git to ignore `.env`:
```
.env
node_modules/
```

### .env.example
This is a template showing WHAT variables are needed, but with fake values.
New developers copy this file, rename it to `.env`, and fill in real values.

---

## PART 12 — CSS DESIGN SYSTEM EXPLAINED

Our CSS follows the "Digital Atelier" design system — a premium, editorial look
inspired by high-end physical workspaces.

### Why 4 separate CSS files?

Instead of one giant CSS file (which becomes impossible to manage),
we split it into 4 focused files:

`styles.css` — The entry point. Just imports the other 4 files in order.

`styles/base.css` — The foundation:
- Imports Google Fonts (Manrope for headings, Inter for body text)
- Imports Material Icons (the icon font from Google)
- Defines CSS variables (color tokens, spacing scale, border radius values)
- Sets global rules (box-sizing, font smoothing, body background)
- Defines typography classes (display-lg, headline-md, body-md, label-sm)

`styles/layout.css` — Structural components:
- Auth page layout (split left/right panels)
- App shell (sidebar + content area grid)
- Sidebar styles
- Buttons (btn-primary, btn-ghost, btn-danger, etc.)
- Form inputs, selects, textareas
- Status chips (chip-active, chip-expiring, chip-expired)
- Toast notifications
- Modal overlays
- Progress bars

`styles/app.css` — Page-specific styles:
- Dashboard header (dark green gradient)
- Metrics strip (4 cards)
- Document cards
- Preview panel
- Upload form
- Settings page layout
- Storage card
- Security items
- Notification items

`styles/responsive.css` — Makes everything work on smaller screens:
- At 1200px: switches dashboard to single column
- At 900px: collapses sidebar to horizontal bar
- At 640px: stacks everything vertically, adjusts padding

### CSS Variables (Design Tokens)
```css
--primary: #061b0e          ← Very dark forest green
--primary-container: #1b3022 ← Deep forest green (used for buttons, headers)
--tertiary: #f7e382          ← Gold/yellow (used as accent "jewelry")
--surface: #fafaf5           ← Warm off-white background
--surface-lowest: #ffffff    ← Pure white (cards, inputs)
--on-surface: #1a1c19        ← Near-black text
```

Why use variables instead of hardcoded colors?
If you want to change the brand color, you change ONE variable and it
updates everywhere automatically. Without variables, you would need to
find and replace the color in hundreds of places.

---

## PART 13 — GITHUB AND VERSION CONTROL

### What is Git?
Git is a tool that tracks every change you make to your code.
Think of it like "Track Changes" in Microsoft Word, but for code.
Every time you commit, Git takes a snapshot of your entire project.

### What is GitHub?
GitHub is a website that stores your Git repository online.
It is like Google Drive but specifically for code.

### Why do we use Git + GitHub?
1. Backup — your code is safe even if your laptop breaks
2. History — you can go back to any previous version
3. Collaboration — multiple people can work on the same project
4. CI/CD — GitHub can automatically run tests when you push code

### The Git commands we used:

`git add .`
Stages all changed files — tells Git "I want to include these in my next snapshot."
The warnings about LF/CRLF are harmless — just Windows converting line endings.

`git commit -m "message"`
Takes the snapshot with a description of what changed.
Good commit messages explain WHY you made the change, not just what.

`git push origin main`
Uploads your local commits to GitHub.
"origin" is the name for your GitHub remote.
"main" is the branch name.

---

## PART 14 — CI/CD PIPELINE EXPLAINED

CI/CD stands for Continuous Integration / Continuous Deployment.

### What does it do?
Every time you push code to GitHub, it automatically:
1. Downloads your code on a fresh server
2. Installs all packages (`npm install`)
3. Runs the linter (`eslint . --ext .js`) — checks code quality
4. Runs the tests (`node tests/run-tests.js`) — checks logic is correct
5. If everything passes → deploys to Render

### Why is this important?
Without CI/CD, you might push broken code to your live website without
realizing it. CI/CD catches mistakes automatically before they reach users.

### Our GitHub Actions workflows:

`.github/workflows/build.yml`
Runs on every push to main branch.
Steps: checkout → setup Node 20 → npm install → lint → test
If any step fails, the whole workflow fails (shown as red X on GitHub).

`.github/workflows/ci.yml`
Same as build.yml — runs quality checks on every push and pull request.

`.github/workflows/deploy-render.yml`
Manual trigger only (workflow_dispatch).
Runs quality checks then calls the Render deploy hook URL.
The deploy hook is a secret URL that tells Render "deploy now."

`.github/workflows/ftp-deploy.yml`
Manual trigger only.
Uploads project files to a web server via FTP (File Transfer Protocol).
Uses secrets: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD, FTP_SERVER_DIR.
Excludes node_modules, .env, .git, and other unnecessary files.

### .circleci/config.yml
CircleCI is an alternative CI/CD service (like GitHub Actions but separate).
Our config uses the `cimg/node:20.0` Docker image.
It caches node_modules between runs to speed up builds.
Runs lint and test on every commit.

---

## PART 15 — TESTS EXPLAINED

### tests/run-tests.js

This file contains 5 automated tests that verify the core logic works correctly.

Why do we write tests?
Tests are like a safety net. When you change code, tests tell you immediately
if you accidentally broke something that was working before.

The 5 tests:

**Test 1: "user password hashing and validation work correctly"**
Creates a User, sets a password, then checks:
- validatePassword("Vaultify123") returns true
- validatePassword("WrongPassword") returns false
This verifies the password hashing system works.

**Test 2: "user reset code can be created and cleared"**
Creates a User, generates a reset code, then checks:
- validatePasswordResetCode(code) returns true
- After clearPasswordResetCode(), validatePasswordResetCode(code) returns false
This verifies the password reset flow works.

**Test 3: "document returns active status for future expiry dates"**
Creates a Document with expiry 60 days in the future.
Checks getExpiryStatus() returns "active".

**Test 4: "document returns expiring-soon status for near expiry dates"**
Creates a Document with expiry 10 days in the future.
Checks getExpiryStatus() returns "expiring-soon".

**Test 5: "document returns expired status for past expiry dates"**
Creates a Document with expiry 2 days in the past.
Checks getExpiryStatus() returns "expired".

These tests do NOT need a database connection — they test the model logic
directly in memory. That is why they run fast and work in CI/CD.

---

## PART 16 — DEPLOYMENT AND HOSTING

### Render.com

Render is a cloud hosting platform. It runs our Node.js server 24/7
so anyone in the world can access the website.

`render.yaml` — The deployment blueprint:
```yaml
services:
  - type: web
    name: vaultify-smartdocs
    runtime: node
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
```

`buildCommand: npm install` — Render installs all packages when deploying.
`startCommand: npm start` — Render runs `node server.js` to start the app.
`healthCheckPath: /health` — Render periodically visits `/health` to check
the app is still running. Our app responds with `{ status: "ok" }`.

Environment variables on Render:
We set MONGODB_URI, PORT, RESET_CODE_EXPIRY_MINUTES, MAX_FILE_SIZE_MB
in Render's dashboard. These are injected into the server as process.env values.

### DNS.md
This file explains how to connect a custom domain (like vaultify.com) to
the Render deployment using a CNAME DNS record.
Render provides free SSL (HTTPS) certificates automatically.

### docker-compose.yml
For local development, instead of installing MongoDB on your computer,
you can run `docker-compose up -d` to start a MongoDB container.
This creates an isolated MongoDB instance that only exists for development.

---

## PART 17 — SECURITY MEASURES

Our app implements several security best practices:

**1. Password Hashing (scrypt)**
Passwords are never stored as plain text. We use scrypt with a random salt.
scrypt is specifically designed to be slow and memory-intensive, making
brute-force attacks extremely difficult.

**2. Token-Based Authentication**
After login, the server generates a random 64-character token.
Only the SHA-256 hash of this token is stored in the database.
The actual token is only ever in the user's browser (localStorage).

**3. Timing-Safe Comparison**
When comparing password hashes or token hashes, we use `crypto.timingSafeEqual`.
Regular string comparison (`===`) can leak information through timing differences.
timingSafeEqual always takes the same amount of time regardless of where
the strings differ.

**4. Owner Verification**
Every document query includes `owner: req.user._id`.
This means a user can NEVER access another user's documents, even if they
know the document's ID.

**5. Sensitive Field Removal**
The User model's toJSON transform automatically removes passwordHash,
passwordSalt, sessions, and reset code fields before sending data to the frontend.

**6. File Size Limits**
Multer rejects files larger than 10 MB before they even reach our code.

**7. Storage Limits**
Each user has a 30 MB storage limit. The server checks before every upload.

**8. Session Management**
Users can have up to 5 active sessions (devices).
Logging out removes only the current session token, not all sessions.
This means logging out on your phone does not log you out on your laptop.

---

## PART 18 — COMPLETE SUMMARY

### What we built:
A full-stack web application with 4 pages, complete CRUD operations,
user authentication, file storage, smart notifications, and cloud deployment.

### Technology stack:
- Frontend: HTML5, CSS3, Vanilla JavaScript, Material Icons, Manrope + Inter fonts
- Backend: Node.js v24, Express.js v4
- Database: MongoDB Atlas (cloud), Mongoose ODM, GridFS for file storage
- Authentication: Custom token-based sessions with SHA-256 hashing
- File handling: Multer (upload), GridFS (storage), streams (download)
- CI/CD: GitHub Actions (3 workflows), CircleCI
- Hosting: Render.com (Singapore region)
- Version control: Git + GitHub

### The 4 CRUD operations:
- CREATE: POST /api/documents — upload a new document
- READ: GET /api/documents — list documents, GET /api/documents/:id/file — view file
- UPDATE: PUT /api/documents/:id — edit document metadata or replace file
- DELETE: DELETE /api/documents/:id — permanently remove document and file

### The complete workflow:
```
Write code locally
    → git add + git commit + git push
        → GitHub stores the code
            → GitHub Actions runs lint + tests automatically
                → If all pass → Render deploys the new version
                    → Live website updates
                        → Users see the new version
```

### Why this project matters:
It demonstrates a complete, production-ready web application following
modern development practices: separation of concerns, security best practices,
automated testing, CI/CD pipeline, cloud database, and cloud hosting.
Every piece has a clear purpose and connects logically to the others.

---

*End of Notes — Vaultify SmartDocs Project*
*Written for assignment submission and learning reference.*
