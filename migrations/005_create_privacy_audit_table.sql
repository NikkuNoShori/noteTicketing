CREATE TABLE IF NOT EXISTS privacy_audit (
    id SERIAL PRIMARY KEY,
    guild_id VARCHAR(20) NOT NULL,
    user_id VARCHAR(20),
    action VARCHAR(50) NOT NULL CHECK (action IN ('data_access', 'data_deletion', 'privacy_toggle', 'export_request', 'api_access')),
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_audit_guild_id ON privacy_audit(guild_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_user_id ON privacy_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_action ON privacy_audit(action);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_timestamp ON privacy_audit(timestamp); 