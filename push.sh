#!/bin/bash
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
git add -A
git status --short
git commit -m "feat: ProjectHealthCard in ProjectDetail + all remaining fixes"
git push origin main
echo "PUSHED"
