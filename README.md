# GPAS — GitHub Profile Analyzer Service

A Node.js + Express + MySQL backend service that fetches public GitHub user profiles, computes rich insights (language breakdown, top repositories, activity score), and stores them in a MySQL database.

---

## Features

- **Analyze** any public GitHub profile by username
- **Store insights**: repo count, followers, language percentages, top starred repos, activity score
- **List** all previously analyzed profiles
- **Fetch** detailed data for a single profile (profile + repos + languages)
- **Compare** two profiles side-by-side with per-metric winners
- **Delete** stored profiles

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | Web framework |
| MySQL | Relational database |
| Axios | HTTP client |
| GitHub REST API | Third-party data source |

---

## Getting Started

### Prerequisites

- **Node.js** v18+ installed
- **MySQL** 8.0+ installed and running
- (Optional) A [GitHub Personal Access Token](https://github.com/settings/tokens) for higher rate limits

### 1. Clone & Install

```bash
cd GPAS
npm install
```

### 2. Set Up the Database

Run the schema file against your MySQL server:

```bash
mysql -u root -p < schema.sql
```

This creates the `gpas_db` database with three tables: `profiles`, `repositories`, `languages`.

### 3. Configure Environment

Copy the example and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3500
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gpas_db
GITHUB_TOKEN=              # Optional but recommended
```

### 4. Start the Server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

You should see:

```
✅  MySQL connection pool established successfully.
🚀  GPAS server running on http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
🚀  GPAS server running on http://localhost:3500
```

<br>

## API Reference

### 1. Analyze Profile
**Endpoint:** `POST /api/profiles/:username`
```bash
curl -X POST http://localhost:3500/api/profiles/torvalds
```

### 2. Get All Profiles
**Endpoint:** `GET /api/profiles`
```bash
curl http://localhost:3500/api/profiles
```

### 3. Get Single Profile
**Endpoint:** `GET /api/profiles/:username`
```bash
curl http://localhost:3500/api/profiles/torvalds
```

### 4. Compare Profiles
**Endpoint:** `GET /api/profiles/compare?users=user1,user2`
```bash
curl "http://localhost:3500/api/profiles/compare?users=torvalds,octocat"
```

### 5. Delete Profile
**Endpoint:** `DELETE /api/profiles/:username`
```bash
curl -X DELETE http://localhost:3500/api/profiles/torvalds
```

---

## Project Structure

```
GPAS/
├── config/
│   └── database.js            # MySQL connection pool
├── controllers/
│   └── profileController.js   # Request/Response handlers
├── middleware/
│   └── errorHandler.js        # Global error middleware
├── models/
│   └── profileModel.js        # SQL queries (data access layer)
├── routes/
│   └── profileRoutes.js       # API route definitions
├── services/
│   └── profileService.js      # Business logic & orchestration
├── utils/
│   └── githubApi.js           # Axios GitHub API client
├── .env / .env.example        # Environment config
├── app.js                     # Express app setup
├── server.js                  # Entry point
├── schema.sql                 # Database schema
└── package.json
```

## License

ISC
