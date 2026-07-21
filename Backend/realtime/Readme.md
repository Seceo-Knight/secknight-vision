# Realtime Service

WebSocket-based realtime service used by SecKnight Vision for:

- agent and frontend authentication
- live screen and webcam stream routing
- remote control events
- latency and connectivity checks
- realtime status and usage updates

## Prerequisites

- Node.js `20+` (recommended)
- npm `10+` (recommended)
- Redis instance (local or remote)
- One free port (default `5001`)
- PM2 (optional, for production process management)

## Project Structure

- `server.js` - entry point (Express + WebSocket + cluster workers)
- `source/handler/datahandler.js` - incoming message type router
- `source/handler/service.js` - event handling business logic
- `public/` - static content served by Express
- `sample.env` - environment variable template

## Setup

From the repository root:

```bash
cd Backend/realtime
npm install
```

Create `.env` from the template:

```bash
cp sample.env .env
```

For Windows PowerShell:

```powershell
Copy-Item sample.env .env
```

## Environment Variables

Use `sample.env` as the source of truth. Important keys:

| Variable | Description |
|---|---|
| `PORT` | HTTP/WebSocket port (default fallback: `5001`) |
| `NODE_ENV` | Runtime environment (`PRODUCTION`, `development`, etc.) |
| `CRYPTO_PASSWORD` | Encryption password used by auth logic |
| `JWT_ACCESS_TOKEN_SECRET` | JWT access token secret |
| `JWT_REFRESH_TOKEN_SECRET` | JWT refresh token secret |
| `JWT_TOKEN_LIFE` | JWT token validity duration |
| `JWT_SECRET` | Additional JWT secret used by legacy paths |
| `REDIS_PORT` | Redis port (default in template: `6379`) |
| `REDIS_HOST` | Main Redis host |
| `REDIS_PASSWORD` | Main Redis password |
| `REDIS_HOST_SUBSCRIBER` | Redis subscriber host |
| `REDIS_PASSWORD_SUBSCRIBER` | Redis subscriber password |
| `REDIS_HOST_PUBLISHER` | Redis publisher host |
| `REDIS_PASSWORD_PUBLISHER` | Redis publisher password |

## Run

### Development

```bash
npm run start:dev
```

### Production (PM2)

```bash
npm run start
```

This starts PM2 with process name `RemoteService`.

Useful PM2 commands:

```bash
pm2 status
pm2 logs RemoteService
pm2 restart RemoteService
pm2 stop RemoteService
```

## Health Check

After start, verify service health:

```bash
curl http://localhost:5001/rt
```

Expected response:

```json
{ "success": true, "message": "Server is running!" }
```

## Supported Realtime Message Types

The message router in `source/handler/datahandler.js` currently handles these event families:

- auth: `agent_auth`, `fe_auth`, `report_auth`
- stream control: `start_image_stream`, `image_request`, `close_agent_data_stream`
- agent status and checks: `check_agent_status`, `check_admin_conneted_status`
- control and latency: `fe_control`, `latency_test`, `latency_test_agent`, `agent_latency_test_request`
- realtime status/usage: `realtime_status_user_connected`, `realtime_connected_agent_status`, `realtime_usage_history_status`
- idle and records: `agent_idle_alert`, `latency_test_send_record`, `system_status_send_record`
- webcam: `admin_request_webcam_stream`, `agent_webcam_stream`, `agent_webcam_stream_counts`, `admin_request_webcam_stream_select`

## Notes

- Service runs in cluster mode with a fixed `numCPUs = 2` in `server.js`.
- Unknown or malformed WebSocket payloads are closed/rejected by the handler.
- Keep secrets in `.env` only; do not commit actual credentials.

## License

ISC