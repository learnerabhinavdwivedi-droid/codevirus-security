@echo off
echo ===================================================
echo   Running Codevirus Integration ^& Security Tests
echo ===================================================
node test-suite.js
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Integration Tests Failed!
  exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   Running Codevirus Scenario Test Harness
echo ===================================================
node scenario-test-suite.js
if %ERRORLEVEL% NEQ 0 (
  echo ❌ Scenario Tests Failed!
  exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   🎉 ALL TESTS PASSED SUCCESSFULLY!
echo ===================================================
