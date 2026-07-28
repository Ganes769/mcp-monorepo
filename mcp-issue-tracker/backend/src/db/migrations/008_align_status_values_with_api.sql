-- Migration: 008_align_status_values_with_api.sql
-- The issues table (created via 006) allows 'open'/'in_progress'/'resolved'/'closed',
-- but the API and frontend both use 'not_started'/'in_progress'/'done'. Inserts with
-- the new vocabulary passed API validation and then failed the DB CHECK constraint.
-- SQLite cannot alter CHECK constraints, so recreate the table and remap old values.

CREATE TABLE issues_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done')),
    assigned_user_id TEXT,
    created_by_user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    FOREIGN KEY (assigned_user_id) REFERENCES "user"(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

INSERT INTO issues_new (id, title, description, status, assigned_user_id, created_by_user_id, created_at, updated_at, priority)
SELECT
    id,
    title,
    description,
    CASE status
        WHEN 'open' THEN 'not_started'
        WHEN 'resolved' THEN 'done'
        WHEN 'closed' THEN 'done'
        ELSE status
    END,
    assigned_user_id,
    created_by_user_id,
    created_at,
    updated_at,
    priority
FROM issues;

DROP TABLE issues;

ALTER TABLE issues_new RENAME TO issues;

CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_user_id ON issues(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_by_user_id ON issues(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);

CREATE TRIGGER IF NOT EXISTS update_issues_updated_at
    AFTER UPDATE ON issues
    FOR EACH ROW
    BEGIN
        UPDATE issues SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
