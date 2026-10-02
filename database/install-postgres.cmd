@echo off
setlocal enabledelayedexpansion

set "PGROOT=C:\Program Files\PostgreSQL"
set "PG_BIN="

for /d %%D in ("%PGROOT%\*") do (
  if exist "%%~fD\bin\psql.exe" set "PG_BIN=%%~fD\bin"
)

if not "%PG_BIN%"=="" (
  echo PostgreSQL is already installed at: %PG_BIN%
  echo.
  echo Run this next:
  echo   database\setup-db.cmd
  exit /b 0
)

echo Installing PostgreSQL using winget...
winget install --id PostgreSQL.PostgreSQL --source winget --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
  echo.
  echo PostgreSQL installation failed.
  echo Please install it manually from:
  echo https://www.postgresql.org/download/windows/
  exit /b 1
)

echo.
echo PostgreSQL install command completed.
echo.
echo Next step:
echo   database\setup-db.cmd
exit /b 0
