# Egocentric Robotics Data Collection

A mobile-friendly web app for collecting egocentric (first-person) video data to train robotics models. Participants sign up, record a video from their phone's rear camera, and upload it to the server along with their metadata.

## Features

- Clean, minimal dark-themed UI optimized for mobile (iOS Safari & Android Chrome)
- Three pages:
  - **Sign-up** (`/`) — collects name, email, environment type, and consent
  - **Record** (`/record.html`) — rear-camera live preview with a record button, timer, review, and upload
  - **Admin** (`/admin.html`) — dashboard of all uploads with totals
- Server-side storage of `.webm` videos and metadata in `data.json`
- Upload progress indicator
- Graceful handling of denied camera permissions

## Setup

Requirements: Node.js 16+

```bash
npm install
npm start
```

The server will start on http://localhost:3000.

- Sign-up page: http://localhost:3000/
- Admin dashboard: http://localhost:3000/admin.html

### Mobile testing

`getUserMedia` requires a secure context. To test from a phone on your LAN, either:

1. Access via `http://localhost:3000` on the same device, or
2. Use a tunnel such as `ngrok http 3000` and open the HTTPS URL on your phone.

## API

### `POST /upload`
Multipart form data:
- `video` — webm video blob
- `userID`, `name`, `email`, `environmentType`, `consentGiven`

Saves the video to `uploads/<userID>_<timestamp>.webm` and appends an entry to `data.json`.

### `GET /admin/data`
Returns all upload entries as JSON.

## Project Structure

```
.
├── server.js          # Express backend
├── package.json
├── public/
│   ├── index.html     # Sign-up page
│   ├── record.html    # Recording page
│   ├── admin.html     # Admin dashboard
│   └── styles.css
├── uploads/           # Video files (gitignored, auto-created)
└── data.json          # Metadata log (gitignored, auto-created)
```

## Notes

- The admin dashboard currently has no authentication. Add auth before deploying publicly.
- Max upload size is 500 MB (configurable in `server.js`).
- `facingMode: environment` requests the rear camera; the browser may fall back to the front camera if unavailable.
