@echo off
setlocal enabledelayedexpansion

set "DB_NAME=nexora"
set "DB_USER=nexora"
set "PGHOST=localhost"
set "PGPORT=5432"

set "PG_BIN="
set "PGROOT=C:\Program Files\PostgreSQL"
for /d %%D in ("%PGROOT%\*") do (
  if exist "%%~fD\bin\psql.exe" set "PG_BIN=%%~fD\bin"
)

if "%PG_BIN%"=="" (
  echo PostgreSQL is not installed or not detected.
  echo Run:
  echo   database\install-postgres.cmd
  exit /b 1
)

set "PATH=%PG_BIN%;%PATH%"

if "%PGPASSWORD%"=="" (
  set /p "PGPASSWORD=Enter the PostgreSQL 'postgres' user password and press Enter: "
)

echo.
echo ===== PostgreSQL server status =====
psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -Atqc "SELECT version();" 2>nul
if errorlevel 1 (
  echo PostgreSQL server is not reachable with the current password.
  exit /b 1
)

echo.
echo ===== Database existence =====
psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -Atqc "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"

echo.
echo ===== Public schema structure =====
psql -h %PGHOST% -p %PGPORT% -U postgres -d %DB_NAME% -Atqc "SELECT table_name, (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) AS columns FROM information_schema.tables t WHERE table_schema = 'public' ORDER BY table_name;"

if errorlevel 1 (
  echo.
  echo Database '%DB_NAME%' was not found or is not accessible.
  echo If needed, create it with:
  echo   database\setup-db.cmd
  exit /b 1
)

echo.
echo ===== Current DB user =====
echo %DB_USER%
exit /b 0
