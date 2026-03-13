@echo off
REM ========================================
REM TopStrike Injury Sync - Daily Update
REM ========================================
REM
REM This script syncs injury data to Supabase
REM Run daily at 6:00 AM via Task Scheduler
REM Or run manually anytime
REM
REM ========================================

echo.
echo ========================================
echo   TopStrike Injury Sync
echo ========================================
echo.
echo Starting sync at %date% %time%
echo.

cd /d "%~dp0"

REM Run the sync script
npm run sync-injuries

echo.
echo ========================================
echo   Sync Complete
echo ========================================
echo.
echo Finished at %time%
echo.

REM Pause only if run manually (not from Task Scheduler)
if "%1" neq "auto" pause
