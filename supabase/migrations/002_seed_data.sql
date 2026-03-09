-- Seed Data - Initial Gameweek
-- Created: 2026-03-06
-- Lock: Friday 14:00 UTC, Unlock: Monday 22:00 UTC

-- Gameweek 1 (March 6-9, 2026)
-- Should be LOCKED now since it's past 14:00 UTC on Friday
INSERT INTO gameweeks (week_number, start_date, end_date, lock_deadline, is_active)
VALUES (
  1,
  '2026-03-06 14:00:00+00',  -- Friday 14:00 UTC (Start)
  '2026-03-09 22:00:00+00',  -- Monday 22:00 UTC (End/Unlock time)
  '2026-03-06 14:00:00+00',  -- Friday 14:00 UTC (Lock time)
  TRUE  -- Currently active
)
ON CONFLICT (week_number) DO UPDATE SET
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  lock_deadline = EXCLUDED.lock_deadline;

-- Note: Gameweeks auto-repeat weekly (Friday 14:00 to Monday 22:00)
-- Add more gameweeks manually if needed or create them via admin interface
