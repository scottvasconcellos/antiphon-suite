# Layer 0 Authority

Entitlement and install authority service for Antiphon Hub.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Create `.env` file (optional):
   ```bash
   PORT=8787
   DB_PATH=./data/authority.db
   FIREBASE_PROJECT_ID=your-project-id
   ```

3. Start the server:
   ```bash
   pnpm dev
   ```

The database (`authority.db`) will be created automatically on first run.

## Database Schema

- **products**: Canonical catalog of all available apps
- **entitlements**: User ownership of products (user_id, product_id)
- **serials**: Valid license keys that can be redeemed
- **sessions**: User authentication state
- **offline_cache**: Per-user offline trust state
- **transactions**: Install/update history

## Generating License Serials

To generate serials for a product:

```bash
node scripts/generate-serials.mjs <productId> <count>
```

Example:
```bash
node scripts/generate-serials.mjs antiphon.layer.chord-scale-helper 10
```

This generates 10 serials formatted as `XXXX-XXXX-XXXX-XXXX`. Copy these to send to customers or store in your purchase system.

## API Endpoints

- `POST /auth/session` - Sign in with email
- `POST /auth/firebase` - Sign in with Firebase token
- `DELETE /auth/session` - Sign out
- `GET /entitlements` - Get user's entitlements (requires auth)
- `POST /entitlements/refresh` - Refresh offline cache
- `POST /redeem` - Redeem a serial and grant entitlement (requires auth)
- `POST /installs/:appId` - Mark app as installed
- `POST /updates/:appId` - Mark app as updated
- `GET /transactions` - Get install/update history
- `GET /offline-cache/status` - Get offline cache state
- `GET /health` - Health check

## Redeem Endpoint

`POST /redeem`

Request body:
```json
{
  "serial": "XXXX-XXXX-XXXX-XXXX"
}
```

Response (success):
```json
{
  "success": true,
  "productId": "antiphon.layer.chord-scale-helper",
  "productName": "Chord Scale Helper",
  "entitlements": [...]
}
```

Response (error):
```json
{
  "success": false,
  "reason": "Serial not found"
}
```

## Migration from state.json

The Authority now uses SQLite for production. The old `state.json` file is still read for backward compatibility, but new operations use the database.

To migrate existing entitlements:
1. Start the Authority server (it will create the database)
2. Products are automatically seeded from `catalog.ts`
3. Manually add entitlements via SQL or create a migration script

## Production Deployment

For production, set `DB_PATH` to a persistent location and ensure the database file is backed up.

The database uses WAL mode for better concurrency. For Postgres migration later, the schema can be adapted.
