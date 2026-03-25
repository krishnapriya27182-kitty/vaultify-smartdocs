# Vaultify SmartDocs — Assignment Submission

**Project Title:** Vaultify SmartDocs - 23BCS_KrishnaPriya

---

## Project Abstract

Managing personal documents like passports, insurance policies, and certificates is often disorganized, leading to missed renewals and lost files. Vaultify SmartDocs solves this by providing a secure, personal digital vault where users can upload, categorize, search, and track expiry dates for all their important documents. Key features include smart expiry alerts, category-based filtering, file preview, and a full CRUD document management system. The platform is built for real-world use cases such as students tracking academic certificates, professionals managing work permits, and individuals organizing identity documents.

---

## Tech Stack

- **Frontend:** HTML5, CSS3 (custom design system), Vanilla JavaScript, Material Icons, Manrope + Inter fonts
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (cloud-hosted)
- **Storage:** GridFS (MongoDB file storage)
- **CI/CD:** GitHub Actions (build, lint, test, deploy), CircleCI
- **Hosting:** Render (web service + database)
- **FTP Deploy:** GitHub Actions FTP workflow
- **Domain/DNS:** Render custom domain + CNAME (see DNS.md)

---

## Modern Web Development Workflow

```
Local Git Repo  →  GitHub  →  CI/CD (GitHub Actions + CircleCI)  →  Render Hosting
     ↓                              ↓ Testing + Linting                    ↓
MongoDB Atlas                    FTP Deploy                         Domain + DNS
```

---

## Four Pages

| Page | URL | Description |
|------|-----|-------------|
| Sign In | `/` | Login with email + password, forgot password flow |
| Sign Up | `/signup.html` | Create account with name, email, recovery email |
| Dashboard | `/dashboard.html` | Full CRUD document management, smart alerts, preview |
| Account Settings | `/settings.html` | Edit profile, change password, storage overview |

---

## CRUD Operations

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| **Create** | `POST /api/documents` | Upload a new document with file |
| **Read** | `GET /api/documents` | List all documents with search/filter |
| **Read** | `GET /api/documents/:id/file` | Stream/preview a document file |
| **Update** | `PUT /api/documents/:id` | Edit document metadata or replace file |
| **Delete** | `DELETE /api/documents/:id` | Permanently delete document + file |

Auth CRUD: signup, login, forgot-password, reset-password, update account settings.

---

## Setup Instructions

### 1. Clone and install

```bash
git clone <your-repo-url>
cd vaultify-smartdocs
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set your MONGODB_URI
```

### 3. Fix MongoDB Atlas IP Access (REQUIRED)

The app uses MongoDB Atlas. You must whitelist your IP:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your cluster → **Network Access**
3. Click **Add IP Address**
4. Add `0.0.0.0/0` (allow from anywhere) — or add your specific IP
5. Click **Confirm**

Without this step the server will fail to connect with `ECONNREFUSED`.

### 4. Start local MongoDB (optional, for local dev)

```bash
docker-compose up -d
# Then set MONGODB_URI=mongodb://127.0.0.1:27017/vaultify-smartdocs in .env
```

### 5. Run the server

```bash
node server.js
# Open http://localhost:3000
```

### 6. Run tests

```bash
node tests/run-tests.js
```

### 7. Run lint

```bash
node_modules/.bin/eslint . --ext .js
```

---

## Project Structure

```
vaultify-smartdocs/
├── .circleci/config.yml          # CircleCI pipeline
├── .github/workflows/
│   ├── build.yml                 # Build & test on push
│   ├── ci.yml                    # Continuous integration
│   ├── deploy-render.yml         # Auto-deploy to Render
│   └── ftp-deploy.yml            # FTP upload after build
├── public/                       # Frontend (HTML + CSS + JS)
│   ├── index.html                # Sign In page
│   ├── signup.html               # Sign Up page
│   ├── dashboard.html            # Main dashboard
│   ├── settings.html             # Account settings
│   ├── common.js                 # Shared utilities
│   ├── login.js / signup.js / dashboard.js / settings.js
│   ├── styles.css                # CSS entry point
│   └── styles/                   # CSS modules
├── src/                          # Backend (Node.js + Express)
│   ├── app.js                    # Express app
│   ├── config/constants.js
│   ├── middleware/               # Auth + upload middleware
│   ├── models/                   # User + Document schemas
│   ├── routes/                   # API route handlers
│   ├── services/                 # Storage + notification services
│   └── utils/authHelpers.js
├── tests/run-tests.js            # Unit tests (5 passing)
├── docker-compose.yml            # Local MongoDB container
├── DNS.md                        # Custom domain setup guide
├── render.yaml                   # Render deployment config
├── .env.example                  # Environment template
└── server.js                     # Entry point
```
