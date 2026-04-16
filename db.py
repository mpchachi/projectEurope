"""
db.py  —  PostgreSQL persistence for session history
Preply Hackathon 2026

Schema:
  sessions(id, student_id, label, source, analyzed_at, cefr_level, result JSONB)

Usage:
  Set DATABASE_URL env var (Northflank injects this automatically for Postgres addons).
  If DATABASE_URL is not set the app runs fine — all db calls are silent no-ops.
"""

import json
import os

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.environ.get("DATABASE_URL")


def _conn():
    if not DATABASE_URL:
        return None
    return psycopg2.connect(DATABASE_URL)


def init_db():
    """Create tables if they don't exist. Call once on server startup."""
    conn = _conn()
    if not conn:
        print("  [db] No DATABASE_URL — running without persistence")
        return
    with conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id          SERIAL      PRIMARY KEY,
                    student_id  TEXT        NOT NULL,
                    label       TEXT        NOT NULL,
                    source      TEXT,
                    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    cefr_level  TEXT,
                    result      JSONB       NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_student_time
                    ON sessions(student_id, analyzed_at DESC);
            """)
    conn.close()
    print("  [db] Schema ready")


def save_session(student_id: str, label: str, source: str, result: dict):
    """Persist one analyzed session. Silent no-op if no DB configured."""
    conn = _conn()
    if not conn:
        return
    cefr = (result.get("cefr") or {}).get("level")
    with conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO sessions (student_id, label, source, cefr_level, result) "
                "VALUES (%s, %s, %s, %s, %s)",
                (student_id, label, source, cefr, json.dumps(result, ensure_ascii=False)),
            )
    conn.close()


def get_history(student_id: str, limit: int = 20) -> list:
    """Return the most recent sessions for a student, newest first."""
    conn = _conn()
    if not conn:
        return []
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, label, source, analyzed_at, cefr_level, result "
            "FROM sessions WHERE student_id = %s "
            "ORDER BY analyzed_at DESC LIMIT %s",
            (student_id, limit),
        )
        rows = cur.fetchall()
    conn.close()
    return [
        {**dict(r), "analyzed_at": r["analyzed_at"].isoformat()}
        for r in rows
    ]
