# ACTIVITY FEED API - QUICK REFERENCE GUIDE

## 6 Available Endpoints

### 1. Get Project Activities
```
GET /api/v1/projects/:projectId/activity
```
**Purpose**: List all activities for a project  
**Auth**: Required  
**Default**: 20 items per page, sorted DESC by createdAt

**Example Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/projects/abc-123/activity?page=1&per_page=20&sort_order=DESC"
```

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `action_type` (optional): CREATED, UPDATED, DELETED, etc.
- `entity_type` (optional): Project, WorkPackage, TimeEntry, etc.
- `user_id` (optional): Filter by user
- `date_from` (optional): ISO date string
- `date_to` (optional): ISO date string
- `sort_by` (optional): Field name (default: createdAt)
- `sort_order` (optional): ASC or DESC (default: DESC)

---

### 2. Get Work Package Activities
```
GET /api/v1/work_packages/:workPackageId/activity
```
**Purpose**: List all activities for a work package  
**Auth**: Required  
**Default**: 20 items per page, sorted DESC by createdAt

**Same query parameters as project activities**

---

### 3. Get User Activity Feed
```
GET /api/v1/activity/feed
```
**Purpose**: Get current authenticated user's activity feed  
**Auth**: Required (extracts userId from token)  
**Default**: 20 items per page, sorted DESC by createdAt

**Example Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/activity/feed?page=1&per_page=20"
```

---

### 4. Get Available Filters
```
GET /api/v1/activity/filters
```
**Purpose**: List all possible action types and entity types  
**Auth**: Required  
**Returns**: Arrays of enum values

**Example Response**:
```json
{
  "action_types": ["CREATED", "UPDATED", "DELETED", "COMMENTED", "ATTACHED", "MENTIONED", "TRANSITIONED", "ASSIGNED", "SHARED"],
  "entity_types": ["Project", "WorkPackage", "TimeEntry", "CostEntry", "Comment", "Attachment", "WikiPage", "Sprint", "Board", "Baseline"],
  "description": "Available filters for activity queries"
}
```

---

### 5. Get Activity Summary
```
GET /api/v1/activity/summary/:projectId
```
**Purpose**: Get summary statistics for project activities  
**Auth**: Required  
**Default**: Last 7 days

**Example Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/projects/abc-123/activity/summary?days=7"
```

**Query Parameters**:
- `days` (optional): Number of days (1-365, default: 7)

**Example Response**:
```json
{
  "project_id": "abc-123",
  "days": 7,
  "total_activities": 42,
  "by_action_type": {
    "CREATED": 10,
    "UPDATED": 20,
    "DELETED": 2,
    "COMMENTED": 5,
    "ATTACHED": 5
  },
  "by_entity_type": {
    "WorkPackage": 15,
    "TimeEntry": 12,
    "CostEntry": 10,
    "Comment": 5
  }
}
```

---

### 6. Get Recent Activities
```
GET /api/v1/activity/recent/:projectId
```
**Purpose**: Get most recent activities for a project  
**Auth**: Required  
**Default**: Last 10 activities

**Example Request**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/projects/abc-123/activity/recent?limit=10"
```

**Query Parameters**:
- `limit` (optional): Number of items (1-100, default: 10)

---

## Activity Response Format

All list endpoints return this structure:

```json
{
  "activities": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "project_id": "abc-123",
      "work_package_id": "wp-456",
      "user_id": "user-789",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "action_type": "CREATED",
      "entity_type": "WorkPackage",
      "entity_id": "wp-456",
      "description": "Created work package",
      "metadata": {
        "subject": "New Feature Development",
        "oldValue": null,
        "newValue": "feature-123"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "per_page": 20
}
```

---

## Common Filtering Examples

### Get all UPDATED activities for a project
```
GET /api/v1/projects/:projectId/activity?action_type=UPDATED
```

### Get all WORK_PACKAGE activities in last 30 days
```
GET /api/v1/projects/:projectId/activity?entity_type=WorkPackage&date_from=2024-01-01&date_to=2024-02-01
```

### Get activities by specific user
```
GET /api/v1/projects/:projectId/activity?user_id=user-789
```

### Combine multiple filters
```
GET /api/v1/projects/:projectId/activity?action_type=CREATED&entity_type=WorkPackage&user_id=user-789&sort_order=DESC&per_page=50
```

### Get second page of results
```
GET /api/v1/projects/:projectId/activity?page=2&per_page=20
```

---

## Error Responses

### Missing Required Parameters
```json
{
  "error": "Bad Request",
  "message": "Invalid date_from format"
}
```

### Invalid Date Format
```json
{
  "error": "Bad Request",
  "message": "Invalid date_to format"
}
```

### Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

---

## HTTP Status Codes

- **200**: Success (GET endpoints)
- **201**: Created (future POST endpoints)
- **204**: No Content (future DELETE endpoints)
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (missing/invalid token)
- **404**: Not Found (entity not found)
- **500**: Server Error

---

## Activity Action Types

```
CREATED     - Entity was created
UPDATED     - Entity was modified
DELETED     - Entity was deleted
COMMENTED   - Comment added
ATTACHED    - File attached
MENTIONED   - User mentioned (@name)
TRANSITIONED - Status changed
ASSIGNED    - Task assigned
SHARED      - Shared with others
```

---

## Activity Entity Types

```
Project         - Project entity
WorkPackage     - Work package/task
TimeEntry       - Time tracking entry
CostEntry       - Cost tracking entry
Comment         - Comment thread
Attachment      - File attachment
WikiPage        - Wiki documentation
Sprint          - Sprint/iteration
Board           - Kanban board
Baseline        - Schedule baseline
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
async function getProjectActivities(projectId, page = 1) {
  const response = await fetch(
    `http://localhost:3000/api/v1/projects/${projectId}/activity?page=${page}&per_page=20`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
}
```

### JavaScript/Axios
```javascript
async function getProjectActivities(projectId, page = 1) {
  const { data } = await axios.get(
    `/api/v1/projects/${projectId}/activity`,
    {
      params: { page, per_page: 20 },
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  return data;
}
```

### cURL
```bash
# Get project activities
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/projects/project-id/activity

# Get with filters
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/projects/project-id/activity?action_type=CREATED&entity_type=WorkPackage&page=1"

# Get recent activities (last 5)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/projects/project-id/activity/recent?limit=5"

# Get summary (last 30 days)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/projects/project-id/activity/summary?days=30"
```

---

## Pagination Guidelines

- **Default**: 20 items per page
- **Minimum**: 1 item per page
- **Maximum**: No hard limit, but 20-50 recommended
- **Total**: Returned in response for calculating pages

### Calculate Total Pages
```javascript
const totalPages = Math.ceil(result.total / result.perPage);
```

---

## Performance Tips

1. **Use pagination** - Always paginate large datasets
2. **Filter early** - Use action_type and entity_type filters to reduce data
3. **Limit date range** - Use date_from/date_to for historical data
4. **Cache responses** - Activity data doesn't change, safe to cache
5. **Use recent endpoint** - For quick "latest activities" needs
6. **Use summary endpoint** - For dashboard statistics instead of filtering

---

## Troubleshooting

### No activities returned
- Check projectId is correct
- Verify authentication token is valid
- Confirm activities exist in database
- Try without filters first

### Unexpected date filtering
- Ensure dates are ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`
- date_from is inclusive, date_to is inclusive
- Timezone is UTC

### Pagination not working
- Verify `page` parameter is a positive integer
- Verify `per_page` is between 1 and reasonable limit
- Check `total` in response for actual count

---

## API Server Startup

The API logs all activity endpoints on startup:

```
🚀 Server is running on http://localhost:3000
📚 API documentation: http://localhost:3000/api/v1
🏥 Health check: http://localhost:3000/health
📊 Activity endpoints: http://localhost:3000/api/v1/projects/:projectId/activity, /api/v1/activity/feed, /api/v1/activity/filters
```

---

## Next: UI Components (Task 11.3)

The frontend will consume these endpoints to display:
- Activity feed on project pages
- Timeline views
- Filter controls
- Real-time updates (WebSocket)

---

**Last Updated**: Today  
**API Version**: 1.0  
**Status**: Production Ready  
**Documentation**: Complete
