# Operations Guide

This document covers deployment, monitoring, and operational procedures for Press!

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Development | localhost:3000 | Local development |
| Preview | pr-*.vercel.app | PR previews |
| Staging | staging.press.app | Pre-production testing |
| Production | press.app | Live application |

## Deployment

### Next.js (Vercel)

1. Push to `main` branch
2. Vercel auto-deploys
3. Preview deployments for PRs

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Supabase

1. Migrations in `/supabase/migrations/`
2. Deploy via Supabase CLI: `supabase db push`
3. Seed data: `supabase db seed`

### Cloudflare Worker

1. Worker code in `/workers/media-proxy/`
2. Deploy via Wrangler: `wrangler deploy`

**Required Secrets:**
- R2 bucket binding
- JWT secret for validation

## Monitoring

### Health Checks

- **Next.js:** `/api/health`
- **Worker:** `/health`
- **Supabase:** Dashboard monitoring

### Logging

- Application logs: Vercel dashboard
- Database logs: Supabase dashboard
- Worker logs: Cloudflare dashboard

### Alerts

Configure alerts for:
- Error rate > 1%
- P95 latency > 2s
- Database connection failures
- R2 upload failures

## Runbooks

### Runbook: Event Lock Issue

**Symptom:** Users cannot edit scores on an event

**Steps:**
1. Check if event is intentionally locked in admin panel
2. If not, check `events.is_locked` in database
3. Use `rpc_unlock_event(event_id, 'support unlock')` to unlock
4. Verify in audit log

### Runbook: Teeth Balance Mismatch

**Symptom:** User's displayed balance doesn't match ledger

**Steps:**
1. Query `teeth_balances` for user's balance
2. Query `teeth_ledger` and sum deltas
3. If mismatch, recalculate: `SELECT SUM(delta_int) FROM teeth_ledger WHERE user_id = ?`
4. Update balance to match ledger sum
5. Add admin ledger entry to document correction

### Runbook: Settlement Computation Failure

**Symptom:** Settlement compute returns error

**Steps:**
1. Check if event is locked
2. Check for incomplete games
3. Verify all participants have scores
4. Check database logs for constraint violations
5. Retry computation

### Runbook: R2 Upload Failure

**Symptom:** Users cannot upload media

**Steps:**
1. Check Worker health endpoint
2. Verify R2 bucket exists and has space
3. Check Worker logs for errors
4. Verify JWT validation is working
5. Test presign endpoint manually

## Disaster Recovery

### Database Backup

- Supabase provides automatic daily backups
- Point-in-time recovery available (Pro plan)

### Data Export

- Export events via admin panel
- Export settlements for reconciliation

### Rollback Procedures

1. **Code rollback:** Revert deployment in Vercel
2. **Schema rollback:** Apply reverse migration
3. **Data rollback:** Restore from backup (last resort)

## Security Incidents

1. **Detection:** Monitor audit logs, error rates
2. **Containment:** Revoke compromised credentials
3. **Notification:** Alert affected users if data exposed
4. **Recovery:** Rotate secrets, patch vulnerabilities
5. **Post-mortem:** Document and improve

## Scheduled Maintenance

### Daily
- Monitor error rates
- Review failed jobs

### Weekly
- Review audit logs
- Check database performance

### Monthly
- Rotate API keys
- Review access permissions
- Test backup restoration
