-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'employee');

-- ============================================================
-- TABLES
-- ============================================================

-- Teams must be created before profiles (FK dependency)
CREATE TABLE teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles linked to Supabase auth.users
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name   TEXT,
    role        user_role NOT NULL DEFAULT 'employee',
    photo_url   TEXT,
    team_id     UUID REFERENCES teams (id) ON DELETE SET NULL,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    bio         TEXT
);

-- Point category catalogue
CREATE TABLE point_categories (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL UNIQUE,
    description  TEXT,
    points_value INT  NOT NULL DEFAULT 0
);

-- Seed the standard categories
INSERT INTO point_categories (name, description, points_value) VALUES
    ('read_book',        'Read a recommended book',                       10),
    ('slack_active',     'Stay active and engaged on Slack',              10),
    ('meetings_breaks',  'Attend meetings and take healthy breaks',       20),
    ('meet_kpis',        'Meet monthly KPI targets',                      10),
    ('agreement_doc',    'Complete agreement documentation',               5),
    ('personal_pdi',     'Work on personal development plan (PDI)',       10),
    ('no_complaints',    'Month without complaints or disciplinary notes', 10);

-- Monthly scores per user per category
CREATE TABLE monthly_scores (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    category_id  UUID NOT NULL REFERENCES point_categories (id) ON DELETE RESTRICT,
    month        DATE NOT NULL,                  -- store as first day of the month
    points_earned INT NOT NULL DEFAULT 0,
    created_by   UUID REFERENCES profiles (id) ON DELETE SET NULL,  -- admin who recorded it
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, category_id, month)
);

-- User roles table (explicit, separate from profiles.role)
CREATE TABLE user_roles (
    user_id  UUID PRIMARY KEY REFERENCES profiles (id) ON DELETE CASCADE,
    role     user_role NOT NULL DEFAULT 'employee'
);

-- ============================================================
-- HELPER: is the calling user an admin?
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
    );
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---- profiles ----
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "profiles_update_owner_or_admin"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id
        OR is_admin()
    )
    WITH CHECK (
        auth.uid() = id
        OR is_admin()
    );

CREATE POLICY "profiles_insert_owner"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_admin"
    ON profiles FOR DELETE
    TO authenticated
    USING (is_admin());

-- ---- teams ----
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_authenticated"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "teams_insert_admin"
    ON teams FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "teams_update_admin"
    ON teams FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "teams_delete_admin"
    ON teams FOR DELETE
    TO authenticated
    USING (is_admin());

-- ---- point_categories ----
ALTER TABLE point_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_categories_select_authenticated"
    ON point_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "point_categories_insert_admin"
    ON point_categories FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "point_categories_update_admin"
    ON point_categories FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "point_categories_delete_admin"
    ON point_categories FOR DELETE
    TO authenticated
    USING (is_admin());

-- ---- monthly_scores ----
ALTER TABLE monthly_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_scores_select_authenticated"
    ON monthly_scores FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "monthly_scores_insert_admin"
    ON monthly_scores FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "monthly_scores_update_admin"
    ON monthly_scores FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "monthly_scores_delete_admin"
    ON monthly_scores FOR DELETE
    TO authenticated
    USING (is_admin());

-- ---- user_roles ----
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_admin"
    ON user_roles FOR SELECT
    TO authenticated
    USING (is_admin());

CREATE POLICY "user_roles_insert_admin"
    ON user_roles FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "user_roles_update_admin"
    ON user_roles FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "user_roles_delete_admin"
    ON user_roles FOR DELETE
    TO authenticated
    USING (is_admin());

-- ============================================================
-- AUTO-PROVISION: create profile + employee role on sign-up
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (id, full_name, photo_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );

    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'employee');

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
