# SkillSwap – Peer-to-Peer Skill Exchange Platform

SkillSwap is a peer-to-peer skill exchange platform that allows students to share their knowledge, learn new skills, and connect with other students.

Students can list skills they can teach, explore skills offered by others, send and manage learning requests, and build connections.

## Features

### Student Features
- Student registration and login.
- Student profile management.
- Add, edit, and delete teaching skills.
- Explore skills offered by other students.
- Search for skills and peers.
- Send, accept, reject, and cancel skill requests.
- Receive notifications for incoming skill requests.
- View accepted connections.
- Disconnect from existing connections.
- Access contact information after a request is accepted.

### Admin Features
- Separate administrator login.
- Admin dashboard with platform statistics.
- Manage student accounts.
- Ban and unban students.
- Monitor and moderate listed skills.
- Monitor skill exchange requests.

### Security Features
- Password hashing.
- Session-based authentication.
- Role-based access control.
- Protected admin routes.
- Contact information privacy.
- Duplicate request prevention.

## Technologies Used

### Frontend
- React.js
- Vite
- HTML
- CSS
- JavaScript
- React Router
- Lucide React

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Express Session
- bcryptjs

## Project Structure

```text
SkillSwap/
│
├── backend/                  # Backend application
│
├── frontend/                 # Original HTML, CSS and JS frontend
│
├── frontend-react/           # Active React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── .env                      # Environment variables (not uploaded)
├── .env.example              # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

**Note:** The active frontend is `frontend-react/`. The original `frontend/` folder is retained as a backup/reference.

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the Project

```bash
cd SkillSwap
```

### 3. Install Backend Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the main project folder using `.env.example` as a reference.

Add your own MongoDB connection string and session secret.

Never upload your actual `.env` file to GitHub.

### 5. Start the Backend

From the main `SkillSwap` folder:

```bash
npm run dev
```

Backend URL:

```text
http://localhost:5000
```

### 6. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend-react
npm install
```

### 7. Start the React Frontend

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

### 8. Build the Frontend

From the `frontend-react` folder:

```bash
npm run build
```

## Database

SkillSwap uses MongoDB to store application data, including student accounts, profiles, skills, requests, and connections.

A MongoDB connection string must be configured in the `.env` file.

## Future Enhancements

- Improved recommendation system.
- More advanced skill discovery.
- Additional student engagement features.
- Improved analytics and reporting.

## Project Purpose

The main objective of SkillSwap is to encourage collaborative learning among students by creating a platform where everyone can teach something and learn something.

---

**SkillSwap – Share Your Skills, Learn Together!**