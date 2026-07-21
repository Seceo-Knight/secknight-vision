# Web Socket Server

Realtime notification microservice for SecKnight Vision.  
It uses SockJS to push events such as message updates, report alerts, geolocation changes, USB alerts, and delivery acknowledgments.

## Prerequisites

- Node.js `20+` (recommended)
- npm `10+` (recommended)
- PM2 (optional, for production)

## Project Structure

- `server.js` - service entry point
- `src/App.js` - HTTP server bootstrap + SockJS initialization
- `src/prefixes/Notifications.js` - connection/message routing
- `src/utils/` - JWT and encryption/decryption helpers
- `src/log/Logger.js` - Winston logger
- `.env.example` - environment template
- `public/` - static test page

## Setup

From repository root:

```bash
cd Backend/web-socket-server
npm install
```

Create environment file:

```bash
cp .env.example .env
```

For Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `8080` | HTTP server port |
| `NOTIFICATION_PREFIX` | `notification` | SockJS endpoint prefix |
| `JWT_ACCESS_TOKEN_SECRET` | - | JWT secret for validation/system auth |
| `CRYPTO_PASSWORD` | - | AES key/password for token decrypt/encrypt |

## Run

### Development

```bash
npm run start:dev
```

### Production (PM2)

```bash
npm start
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs server
pm2 restart server
pm2 stop server
```

## Endpoints

- Health check: `GET /api/custom/on-premise-socket`
  - response: `{ "code": 200, "message": "Success" }`
- SockJS endpoint: `http://localhost:<PORT>/<NOTIFICATION_PREFIX>`
  - example: `http://localhost:8080/notification`

## Message Types

Implemented in `src/prefixes/Notifications.js`.

### Authentication

- `auth` - user/client authenticates and binds socket to `user_id`
- `sysAuth` - backend/system connection authenticates

### System to User Notifications

- `messages`
- `newMessages`
- `agentUninstall`
- `newReport`
- `newReportBeforeDelete`
- `newReportAfterDelete`
- `employeeGeolocationChange`
- `usbAlert`

### User to System

- `delivered` - message delivery acknowledgment

## Runtime Behavior

- Supports multiple active sockets per user (`usersConnectsById`).
- System connections are maintained separately (`systemConnects`).
- User notifications are broadcast to all active sockets for that user.
- `delivered` events are forwarded to a random system connection.
- If no system connection exists, forwarding retries after 5 seconds.

## Notes

- `npm start` runs `prestart` first (`npm i`), as defined in `package.json`.
- Invalid/expired auth tokens return an error payload.
- Keep `.env` secrets private and out of version control.
