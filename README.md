# Vaultify SmartDocs - 25BCNA49_Sarala J S

Vaultify SmartDocs is a full-stack document management web application where every user has a personal account, a private dashboard, and a secure place to manage their important files online.

## Features

- User sign up and sign in with personal email and password
- Private user-specific dashboard so each person sees only their own documents
- Forgot-password flow with reset code support
- Upload documents with title, category, description, tags, and expiry date
- View, search, filter, edit, and delete documents
- Expiry tracking for active, expiring soon, expired, and no-expiry documents
- MongoDB-backed file storage using GridFS so uploaded files persist in production
- Render-ready deployment setup using `render.yaml`

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB with Mongoose and GridFS
- Deployment: Render

## Project Structure

```text
project/
|-- public/
|   |-- index.html
|   |-- styles.css
|   `-- script.js
|-- src/
|   `-- models/
|       |-- Document.js
|       `-- User.js
|-- uploads/
|-- .env.example
|-- .gitignore
|-- package.json
|-- README.md
|-- render.yaml
`-- server.js
```

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from `.env.example`.

3. Ensure MongoDB is running locally, or use a remote MongoDB connection string.

4. Start the app:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000`

## Environment Variables

- `MONGODB_URI` - MongoDB connection string
- `PORT` - server port
- `RESET_CODE_EXPIRY_MINUTES` - forgot-password reset code validity time
- `MAX_FILE_SIZE_MB` - maximum upload size in megabytes

## Render Deployment

### What changed for Render

Render does not preserve normal local file uploads across redeploys on free services, so this project now stores uploaded documents in MongoDB GridFS. That means document files remain available even after redeploys and restarts, as long as your MongoDB database stays active.

### Deploy from GitHub to Render

1. Push this project to a GitHub repository.
2. Create a MongoDB Atlas database, or use another remote MongoDB instance.
3. In Render, create a new Blueprint or Web Service connected to your GitHub repo.
4. If using Blueprint deployment, Render will detect `render.yaml` automatically.
5. Add the `MONGODB_URI` environment variable in Render with your remote MongoDB connection string.
6. Deploy the app.
7. After deployment, open your public Render URL:

   ```text
   https://your-service-name.onrender.com
   ```

## GitHub Push Commands

```bash
git init
git add .
git commit -m "Prepare Vaultify SmartDocs for Render deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## API Endpoints

- `GET /health` - health check endpoint for Render
- `POST /api/auth/signup` - create a new user account
- `POST /api/auth/login` - sign in with email and password
- `POST /api/auth/forgot-password` - generate a password reset code
- `POST /api/auth/reset-password` - reset the password using email and reset code
- `GET /api/auth/me` - get the signed-in user profile
- `POST /api/auth/logout` - log out the current session
- `GET /api/documents` - fetch the signed-in user's documents with search/filter support
- `GET /api/documents/:id` - fetch one document for the signed-in user
- `GET /api/documents/:id/file` - open a stored file for the signed-in user
- `POST /api/documents` - create a document with file upload for the signed-in user
- `PUT /api/documents/:id` - update document details or replace file
- `DELETE /api/documents/:id` - delete a document and its uploaded file

## Notes

- User accounts, document details, and uploaded files are all stored dynamically in MongoDB.
- No static or hardcoded records are used.
- The forgot-password reset code is shown in the UI for demo purposes. In a production app, this should be sent through email.
- If you use Render Free, the service may sleep when inactive, so the first request can take a little longer.
