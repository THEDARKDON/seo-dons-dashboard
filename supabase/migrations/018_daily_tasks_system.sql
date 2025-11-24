-- Daily Tasks System
-- Gamified daily task tracking with automatic reset functionality

-- ========================================
-- DAILY TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_date DATE NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN (
    'calls',
    'appointments',
    'linkedin',
    'prospecting',
    'research'
  )),

  -- Target and Progress
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Gamification
  points_earned INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one task per user per day per type
  UNIQUE(user_id, task_date, task_type)
);

-- ========================================
-- KPI GOALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS kpi_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Goal Definition
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'mrr_minimum',
    'mrr_target',
    'calls_daily',
    'calls_weekly',
    'calls_monthly',
    'appointments_daily',
    'appointments_weekly',
    'appointments_monthly',
    'deals_monthly'
  )),

  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  target_value DECIMAL(12, 2) NOT NULL,

  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- USER STREAKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Streak Data
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completion_date DATE,

  -- Total Stats
  total_days_completed INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_completed ON daily_tasks(user_id, completed);

CREATE INDEX IF NOT EXISTS idx_kpi_goals_user ON kpi_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_kpi_goals_active ON kpi_goals(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update daily_tasks updated_at
CREATE OR REPLACE FUNCTION update_daily_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_tasks_timestamp
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_tasks_timestamp();

-- Function to calculate points based on task type
CREATE OR REPLACE FUNCTION calculate_task_points(task_type TEXT, completed BOOLEAN)
RETURNS INTEGER AS $$
BEGIN
  IF NOT completed THEN
    RETURN 0;
  END IF;

  CASE task_type
    WHEN 'calls' THEN RETURN 20;
    WHEN 'appointments' THEN RETURN 30;
    WHEN 'linkedin' THEN RETURN 10;
    WHEN 'prospecting' THEN RETURN 15;
    WHEN 'research' THEN RETURN 10;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update points when task is completed
CREATE OR REPLACE FUNCTION auto_assign_task_points()
RETURNS TRIGGER AS $$
BEGIN
  -- If task just became completed
  IF NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL) THEN
    NEW.points_earned = calculate_task_points(NEW.task_type, TRUE);
    NEW.completed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_task_points
  BEFORE UPDATE ON daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_task_points();

-- Function to update user streak on task completion
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_task_date DATE;
  v_all_required_complete BOOLEAN;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_last_date DATE;
BEGIN
  v_user_id := NEW.user_id;
  v_task_date := NEW.task_date;

  -- Check if all required tasks for the day are complete
  SELECT
    BOOL_AND(completed) INTO v_all_required_complete
  FROM daily_tasks
  WHERE user_id = v_user_id
    AND task_date = v_task_date
    AND task_type IN ('calls', 'appointments');

  -- If all required tasks are complete, update streak
  IF v_all_required_complete THEN
    -- Get current streak data
    SELECT current_streak, longest_streak, last_completion_date
    INTO v_current_streak, v_longest_streak, v_last_date
    FROM user_streaks
    WHERE user_id = v_user_id;

    -- If no streak record exists, create one
    IF NOT FOUND THEN
      INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completion_date, total_days_completed, total_points_earned)
      VALUES (v_user_id, 1, 1, v_task_date, 1, NEW.points_earned);
    ELSE
      -- Check if this is a consecutive day
      IF v_last_date = v_task_date - INTERVAL '1 day' THEN
        v_current_streak := v_current_streak + 1;
      ELSIF v_last_date < v_task_date - INTERVAL '1 day' THEN
        -- Streak broken
        v_current_streak := 1;
      END IF;

      -- Update longest streak if current is higher
      IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
      END IF;

      -- Update streak record
      UPDATE user_streaks
      SET
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_completion_date = v_task_date,
        total_days_completed = total_days_completed + 1,
        total_points_earned = total_points_earned + NEW.points_earned,
        updated_at = NOW()
      WHERE user_id = v_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_streak
  AFTER UPDATE ON daily_tasks
  FOR EACH ROW
  WHEN (NEW.completed = TRUE AND (OLD.completed = FALSE OR OLD.completed IS NULL))
  EXECUTE FUNCTION update_user_streak();

-- ========================================
-- DEFAULT DATA
-- ========================================

-- Insert default KPI goals (these will be user-specific, but we set defaults here)
-- Admins can override these per user

-- Default MRR goals
INSERT INTO kpi_goals (goal_type, period, target_value, start_date, is_active) VALUES
  ('mrr_minimum', 'monthly', 7000.00, CURRENT_DATE, TRUE),
  ('mrr_target', 'monthly', 9000.00, CURRENT_DATE, TRUE)
ON CONFLICT DO NOTHING;

-- Default call goals
INSERT INTO kpi_goals (goal_type, period, target_value, start_date, is_active) VALUES
  ('calls_daily', 'daily', 50.00, CURRENT_DATE, TRUE),
  ('calls_weekly', 'weekly', 250.00, CURRENT_DATE, TRUE),
  ('calls_monthly', 'monthly', 1000.00, CURRENT_DATE, TRUE)
ON CONFLICT DO NOTHING;

-- Default appointment goals
INSERT INTO kpi_goals (goal_type, period, target_value, start_date, is_active) VALUES
  ('appointments_daily', 'daily', 3.00, CURRENT_DATE, TRUE),
  ('appointments_weekly', 'weekly', 15.00, CURRENT_DATE, TRUE),
  ('appointments_monthly', 'monthly', 60.00, CURRENT_DATE, TRUE)
ON CONFLICT DO NOTHING;

-- ========================================
-- RLS POLICIES
-- ========================================

-- Disable RLS for now (protected by Clerk middleware)
ALTER TABLE daily_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks DISABLE ROW LEVEL SECURITY;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE daily_tasks IS 'Tracks daily task completion with gamification features';
COMMENT ON TABLE kpi_goals IS 'Stores KPI goals and targets for users';
COMMENT ON TABLE user_streaks IS 'Tracks user streaks and total completion stats';

COMMENT ON COLUMN daily_tasks.task_type IS 'Type of task: calls, appointments, linkedin, prospecting, research';
COMMENT ON COLUMN daily_tasks.target_value IS 'Target number for completion (e.g., 50 calls)';
COMMENT ON COLUMN daily_tasks.current_value IS 'Current progress toward target';
COMMENT ON COLUMN daily_tasks.points_earned IS 'Points earned for completing this task';

COMMENT ON COLUMN user_streaks.current_streak IS 'Current consecutive days with all required tasks completed';
COMMENT ON COLUMN user_streaks.longest_streak IS 'Longest streak ever achieved';
