-- Migration: Create api_rate_limits table for rate limiting

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier_requested_at
  ON api_rate_limits (identifier, requested_at); 