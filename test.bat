@echo off
REM ==============================================================================
REM Shopping Cart System - Run Automated E2E Test Suite (Windows Batch)
REM ==============================================================================

cd /d "%~dp0"

echo Running End-to-End (E2E) Integration and Security Test Suite...
node e2e_test.js
pause
