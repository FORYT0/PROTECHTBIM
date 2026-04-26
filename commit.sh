#!/bin/bash
cd 'C:/Users/User/AndroidStudioProjects/PROTECHT BIM'
git add -A
git status --short
git commit -m "fix: responsiveness + project-scoped pages + no horizontal scroll

- overflow-x:hidden on html/body/#root
- InteractiveCard: min-w-0 + overflow:hidden + truncate (no more blowout)
- Layout: compact nav, overflow-x scrollable pill strip, mobile stack
- Nav links include project_id param for context-aware routing
- useProjectContext hook: auto-selects first project, caches in localStorage
- ProjectPicker component: dropdown in page header to switch projects
- SnagsPage: rewrite with hook - loads data automatically without URL param
- DailyReportsPage: rewrite with hook - responsive grid
- ChangeOrdersPage/ContractsPage: ProjectPicker added"
git push origin main
echo "DONE"
