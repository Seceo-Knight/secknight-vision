# Remote Socket Service

WebSocket-based backend service for remote monitoring and control between SecKnight Vision frontend and agent clients.

## What It Handles

- agent and frontend authentication
- screenshot/image stream coordination
- remote control events from frontend to agent
- agent online checks
- latency checks and latency record events

## Prerequisites

- Node.js `20+` (recommended)
- npm `10+` (recommended)
- Redis instance (local or remote)
- One free port (default `5001`)
- PM2 (optional, for production process management)

## Project Structure

- `server.js` - Express + WebSocket entry point
- `source/handler/datahandler.js` - message router by `type`
- `source/handler/service.js` - service-level event handlers
- `public/` - static files served by Express
- `sample.env` - environment template

## Setup

From repository root:

```bash
cd Backend/remote_socket
npm install
```

Create environment file:

```bash
cp sample.env .env
```

For Windows PowerShell:

```powershell
Copy-Item sample.env .env
```

## Environment Variables

Populate `.env` using `sample.env`:

| Variable | Description |
|---|---|
| `PORT` | Service port (falls back to `5001`) |
| `NODE_ENV` | Runtime environment |
| `CRYPTO_PASSWORD` | Encryption password used in auth paths |
| `JWT_ACCESS_TOKEN_SECRET` | Access token signing secret |
| `JWT_REFRESH_TOKEN_SECRET` | Refresh token signing secret |
| `JWT_TOKEN_LIFE` | JWT lifetime |
| `JWT_SECRET` | Additional JWT secret key |
| `REDIS_HOST` | Redis host |
| `REDIS_PASSWORD` | Redis password |

## Run

### Development

```bash
npm run start:dev
```

### Production (PM2)

```bash
npm run start
```

Useful PM2 commands:

```bash
pm2 status
pm2 logs RemoteService
pm2 restart RemoteService
pm2 stop RemoteService
```

## Health Check

The service exposes:

```http
GET /
```

Expected response:

```json
{ "success": true, "message": "Server is running!" }
```

## Supported Message Types

Implemented in `source/handler/datahandler.js`:

- auth: `agent_auth`, `fe_auth`
- stream: `start_image_stream`, `image_request`
- status and control: `check_agent_status`, `fe_control`
- latency: `latency_test`, `latency_test_agent`, `agent_latency_test_request`, `latency_test_send_record`

## Notes

- Invalid or malformed payloads close the WebSocket connection.
- Keep `.env` secrets private and never commit real credentials.

## License

ISC