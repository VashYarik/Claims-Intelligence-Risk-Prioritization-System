import Database from "better-sqlite3";
import path from "path";
import os from "os";

// Store DB in the project directory for this demo
const dbPath = path.join(process.cwd(), "claims.db");

// Initialize database
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    riskScore INTEGER NOT NULL,
    riskLevel TEXT NOT NULL,
    amount REAL NOT NULL,
    incidentType TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    explanation TEXT NOT NULL,
    anomalyFlag TEXT,
    claimant TEXT NOT NULL,
    adjuster TEXT NOT NULL,
    policy TEXT NOT NULL,
    location TEXT NOT NULL,
    witnesses INTEGER,
    priorClaims INTEGER NOT NULL,
    notes TEXT
  )
`);

export default db;
