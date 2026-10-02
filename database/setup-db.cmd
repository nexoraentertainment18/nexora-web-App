@echo off
setlocal enabledelayedexpansion

set "DB_NAME=nexora"
set "DB_USER=nexora"
set "DB_PASSWORD=nexora"
set "PGHOST=localhost"
set "PGPORT=5432"

set "PG_BIN="
set "PGROOT=C:\Program Files\PostgreSQL"
for /d %%D in ("%PGROOT%\*") do (
  if exist "%%~fD\bin\psql.exe" set "PG_BIN=%%~fD\bin"
)

if "%PG_BIN%"=="" (
  echo PostgreSQL is not installed or not added to the PATH.
  echo Run:
  echo   database\install-postgres.cmd
  exit /b 1
)

set "PATH=%PG_BIN%;%PATH%"

rem Prompt for postgres password if not already supplied in environment
if not "%PGPASSWORD%"=="" goto :check_db
set /p "PGPASSWORD=Enter the PostgreSQL 'postgres' user password and press Enter: "

:check_db
echo.
echo Checking whether PostgreSQL is reachable...
psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -tc "SELECT 1;" >nul 2>&1
if errorlevel 1 (
  echo Cannot connect to PostgreSQL.
  echo Make sure PostgreSQL is running and the password is correct.
  exit /b 1
)

echo Creating database %DB_NAME% if needed...
psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname = '%DB_NAME%'" | findstr "1" >nul
if errorlevel 1 (
  echo Database %DB_NAME% does not exist. Creating it now...
  createdb -h %PGHOST% -p %PGPORT% -U postgres %DB_NAME%
  if errorlevel 1 (
    echo Failed to create database %DB_NAME%.
    exit /b 1
  )
) else (
  echo Database %DB_NAME% already exists.
)

echo Creating user %DB_USER% if needed...
psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_roles WHERE rolname = '%DB_USER%'" | findstr "1" >nul
if errorlevel 1 (
  echo User %DB_USER% does not exist. Creating it now...
  psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%';"
  if errorlevel 1 (
    echo Failed to create user %DB_USER%.
    exit /b 1
  )
) else (
  echo User %DB_USER% already exists.
)

psql -h %PGHOST% -p %PGPORT% -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER DATABASE %DB_NAME% OWNER TO %DB_USER%;"
psql -h %PGHOST% -p %PGPORT% -U postgres -d %DB_NAME% -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -h %PGHOST% -p %PGPORT% -U postgres -d %DB_NAME% -v ON_ERROR_STOP=1 -c "CREATE SCHEMA IF NOT EXISTS public;"
psql -h %PGHOST% -p %PGPORT% -U postgres -d %DB_NAME% -v ON_ERROR_STOP=1 -c "ALTER SCHEMA public OWNER TO %DB_USER%;"

echo.
echo PostgreSQL setup complete.
echo Recommended environment values:
echo   DB_URL=jdbc:postgresql://localhost:5432/%DB_NAME%
echo   DB_USERNAME=%DB_USER%
echo   DB_PASSWORD=%DB_PASSWORD%
exit /b 0
