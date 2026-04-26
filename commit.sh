#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
sleep 60
echo "=== FULL TEST AFTER REDEPLOY ===" > "$LOG"
C:/Python314/python.exe test_routes.py >> "$LOG" 2>&1
cat "$LOG"
