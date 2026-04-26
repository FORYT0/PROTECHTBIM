#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== FIX WP ===" > "$LOG"
C:/Python314/python.exe fix_wp.py >> "$LOG" 2>&1
cat "$LOG"
