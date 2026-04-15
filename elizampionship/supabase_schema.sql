-- ============================================================
-- ELiZampionship – Supabase Schema
-- Run this in your Supabase project → SQL Editor
-- ============================================================

-- Participants (players / employees)
CREATE TABLE participants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    photo_url  TEXT,
    team       TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Score categories (e.g. "Round 1", "Challenge A", "June 2026")
CREATE TABLE score_labels (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label      TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual scores: one row per participant × label
CREATE TABLE scores (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants (id) ON DELETE CASCADE,
    label_id       UUID NOT NULL REFERENCES score_labels  (id) ON DELETE CASCADE,
    points         INT  NOT NULL DEFAULT 0,
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (participant_id, label_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_labels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores        ENABLE ROW LEVEL SECURITY;

-- Anyone can READ (public leaderboard)
CREATE POLICY "public_read_participants"  ON participants  FOR SELECT USING (true);
CREATE POLICY "public_read_score_labels" ON score_labels  FOR SELECT USING (true);
CREATE POLICY "public_read_scores"       ON scores        FOR SELECT USING (true);

-- Only authenticated users (admins) can WRITE
CREATE POLICY "admin_write_participants"  ON participants  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_write_score_labels" ON score_labels  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_write_scores"       ON scores        FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Optional seed: create your first score category
-- ============================================================
-- INSERT INTO score_labels (label, sort_order) VALUES ('Round 1', 1);
-- INSERT INTO score_labels (label, sort_order) VALUES ('Round 2', 2);
