PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    website TEXT,
    industry TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    title TEXT,
    company_id INTEGER REFERENCES companies (id) ON DELETE SET NULL,
    notes TEXT,
    whatsapp_number TEXT,
    messenger_psid TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'LEAD'
        CHECK (stage IN ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST')),
    company_id INTEGER REFERENCES companies (id) ON DELETE SET NULL,
    contact_id INTEGER REFERENCES contacts (id) ON DELETE SET NULL,
    expected_close_date TEXT,
    closed_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'TASK'
        CHECK (type IN ('TASK', 'CALL', 'EMAIL', 'MEETING', 'NOTE')),
    title TEXT NOT NULL,
    notes TEXT,
    due_date TEXT,
    completed_at TEXT,
    contact_id INTEGER REFERENCES contacts (id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES deals (id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies (id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'MESSENGER')),
    direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT')),
    external_id TEXT,
    contact_id INTEGER NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
    body TEXT,
    media_url TEXT,
    status TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- INDEXES
-- (created after column migrations run, since some of these reference
-- columns that only exist on older databases once db.py patches them in)
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON contacts (whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_contacts_messenger ON contacts (messenger_psid);
CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages (contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_external_id
    ON messages (channel, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_company ON deals (company_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals (contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities (contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities (deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities (company_id);
CREATE INDEX IF NOT EXISTS idx_activities_due_date ON activities (due_date);
