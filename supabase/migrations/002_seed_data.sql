-- Seed Data - Initial Gameweek
-- Created: 2026-03-06

-- Create first gameweek (example - adjust dates as needed)
INSERT INTO gameweeks (week_number, start_date, end_date, lock_deadline, is_active)
VALUES (
  1,
  '2026-03-06',  -- Start date
  '2026-03-13',  -- End date
  '2026-03-06 23:59:00+00',  -- Lock deadline (11:59 PM UTC Friday)
  TRUE  -- Currently active
);

-- Note: Add more gameweeks as needed throughout the season
