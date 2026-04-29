#!/bin/bash
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
C:/Python314/python.exe fix_exports.py
git add -A
git status --short
git commit -m "fix: WikiPageBoard default export for lazy import compatibility" 2>/dev/null || echo "nothing to commit"
git push origin main 2>/dev/null || echo "nothing to push"
echo "DONE"
