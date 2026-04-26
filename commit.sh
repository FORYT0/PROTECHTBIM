#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== CONTRACT CHECK ===" > "$LOG"
C:/Python314/python.exe check_contracts.py >> "$LOG" 2>&1
cat "$LOG"
