# OHIF Viewer State Persistence Backend

A lightweight Express.js backend service for persisting OHIF medical imaging viewer state, including user annotations (measurements) and preferences (theme, hotkeys).

## Features

- **Keycloak OIDC Authentication** - JWT validation against Keycloak JWKS endpoint
- **Per-user State Persistence** - All data scoped by Keycloak user ID (`sub` claim)
- **Annotation Storage** - Save/load measurements per DICOM study
- **Preferences Storage** - Save/load user preferences (theme, hotkeys)
- **Schema Decoupled** - Request bodies stored as raw JSON strings for frontend flexibility

## Requirements

- Node.js 18+
- PostgreSQL database
- Keycloak server with OIDC realm configured

## Environment Variables

```env
PORT=3050
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Keycloak configuration
KEYCLOAK_REALM_URL=http://localhost:8080/realms/ohif
KEYCLOAK_CLIENT_ID=ohif-viewer
```

## Installation

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

All endpoints require a valid Keycloak Bearer token:

```
Authorization: Bearer <keycloak_access_token>
```

### Preferences

#### GET /api/state/preferences

Returns the user's saved preferences.

**Response (200)** - when data exists:
```json
{
  "hotkeys": { "some-command-hash": ["ctrl", "z"] },
  "theme": "DENTAL"
}
```

**Response (200)** - when no data exists:
```json
null
```

#### PUT /api/state/preferences

Saves/overwrites the user's preferences.

**Request body:**
```json
{
  "hotkeys": { "some-command-hash": ["ctrl", "z"] },
  "theme": "RADIOLOGY"
}
```

**Response (200):**
```json
{ "success": true }
```

### Annotations

#### GET /api/state/annotations/:studyUID

Returns saved annotations for a specific DICOM study.

**Response (200)** - when data exists:
```json
{
  "annotations": [
    {
      "annotationUID": "abc-123",
      "metadata": {
        "toolName": "Length",
        "referenceStudyUID": "1.2.3.4",
        "referenceSeriesUID": "1.2.3.5",
        "SOPInstanceUID": "1.2.3.6",
        "FrameOfReferenceUID": "1.2.3.7"
      },
      "data": {
        "label": "PA Length",
        "points": [],
        "cachedStats": {},
        "displayText": {}
      }
    }
  ]
}
```

**Response (200)** - when no data exists:
```json
{ "annotations": [] }
```

#### PUT /api/state/annotations/:studyUID

Saves/overwrites all annotations for a study. The frontend sends the full annotation array on every save.

**Request body:**
```json
{
  "annotations": [...]
}
```

**Response (200):**
```json
{ "success": true }
```

#### DELETE /api/state/annotations/:studyUID

Deletes all saved annotations for a study.

**Response (200):**
```json
{ "success": true }
```

## Error Responses

**401 Unauthorized** - Missing or invalid token:
```json
{ "message": "No token provided" }
```

**500 Internal Server Error**:
```json
{ "error": "message" }
```

## Database Schema

```sql
CREATE TABLE user_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_annotations (
  user_id VARCHAR(255) NOT NULL,
  study_uid VARCHAR(255) NOT NULL,
  data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, study_uid)
);
```

## CORS Configuration

By default, CORS is configured to allow requests from:
- `http://localhost:3000` (OHIF dev server)

Update `src/index.ts` to add additional origins as needed.

## Project Structure

```
src/
├── domains/
│   └── state/
│       ├── state.controller.ts
│       ├── state.service.ts
│       ├── state.repository.ts
│       ├── state.interface.ts
│       └── state.route.ts
├── middlewares/
│   ├── keycloak.ts
│   ├── errorHandler.ts
│   └── validate.ts
├── classes/
│   └── error.ts
├── utils/
│   └── logger/
├── container.ts
└── index.ts
```

## License

ISC
