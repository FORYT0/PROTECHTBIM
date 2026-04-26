#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== CREATE TESTS ===" > "$LOG"
C:/Python314/python.exe test_create.py >> "$LOG" 2>&1
cat "$LOG"
