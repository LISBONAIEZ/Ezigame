-- ============================================================
-- ELiZampionship – Supabase Schema (updated for original design)
-- Run in: Supabase → SQL Editor
-- ============================================================

-- Player points: one row per player
CREATE TABLE player_points (
    player_name  TEXT PRIMARY KEY,
    team_name    TEXT NOT NULL DEFAULT '',
    points       INT  NOT NULL DEFAULT 0,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE player_points ENABLE ROW LEVEL SECURITY;

-- Anyone can READ (public leaderboard)
CREATE POLICY "public_read"  ON player_points FOR SELECT USING (true);

-- Only authenticated admins can WRITE
CREATE POLICY "admin_write"  ON player_points FOR ALL    USING (auth.role() = 'authenticated');

-- ============================================================
-- Seed initial rows for all players (optional – the app
-- will upsert automatically, but seeding avoids first-load lag)
-- ============================================================
INSERT INTO player_points (player_name, team_name, points) VALUES
  ('Jennifer','Rangers',0),('Roberto','Rangers',0),('Atea','Rangers',0),('Sara','Rangers',0),('Artem','Rangers',0),
  ('Heinze','Converters',0),('Maryna','Converters',0),('Denis','Converters',0),('Elson','Converters',0),('Gabriela','Converters',0),
  ('Sagar','CTR Crew',0),('Antonino','CTR Crew',0),('Jeffrey','CTR Crew',0),('Michele','CTR Crew',0),('Alex','CTR Crew',0),
  ('Vlad','Mile Legends',0),('Jeremiah','Mile Legends',0),('Ifham','Mile Legends',0),('Nico','Mile Legends',0),('Omer','Mile Legends',0)
ON CONFLICT (player_name) DO NOTHING;
