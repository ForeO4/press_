-- Press! RPC Permission Grants
-- Migration: 0006_grant_rpc_permissions.sql
-- Grant execute permissions on RPC functions to authenticated users
--
-- Root Cause: Functions in 0003_rpcs.sql were defined but never granted
-- to the authenticated role, causing 403 Forbidden errors when calling
-- RPC functions like rpc_create_event from the app.

-- Event management
GRANT EXECUTE ON FUNCTION rpc_create_event(TEXT, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_lock_event(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_unlock_event(UUID, TEXT) TO authenticated;

-- Score management
GRANT EXECUTE ON FUNCTION rpc_upsert_score(UUID, UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- Press/game management
GRANT EXECUTE ON FUNCTION rpc_create_press(UUID, INTEGER, INTEGER) TO authenticated;

-- Settlement
GRANT EXECUTE ON FUNCTION rpc_compute_settlement(UUID) TO authenticated;

-- Teeth (currency) management
GRANT EXECUTE ON FUNCTION rpc_grant_teeth(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_initialize_teeth(UUID, UUID) TO authenticated;

-- Calcutta pools
GRANT EXECUTE ON FUNCTION rpc_create_calcutta_pool(UUID, TEXT, TEXT, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_settle_calcutta(UUID) TO authenticated;

-- Helper functions (used by RLS policies - explicit grant for API access)
GRANT EXECUTE ON FUNCTION is_event_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_event_owner(UUID) TO authenticated;
