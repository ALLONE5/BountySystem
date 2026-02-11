-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name VARCHAR(255) NOT NULL DEFAULT '赏金猎人平台',
    site_description TEXT DEFAULT '基于任务的协作平台',
    logo_url VARCHAR(500) DEFAULT '',
    allow_registration BOOLEAN NOT NULL DEFAULT true,
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    max_file_size INTEGER NOT NULL DEFAULT 10, -- MB
    default_user_role VARCHAR(50) NOT NULL DEFAULT 'user',
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    smtp_host VARCHAR(255) DEFAULT '',
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(255) DEFAULT '',
    smtp_password VARCHAR(255) DEFAULT '',
    smtp_secure BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at ON system_config(updated_at);

-- Insert default configuration
INSERT INTO system_config (
    site_name,
    site_description,
    logo_url,
    allow_registration,
    maintenance_mode,
    max_file_size,
    default_user_role,
    email_enabled,
    smtp_host,
    smtp_port,
    smtp_user,
    smtp_password,
    smtp_secure
) VALUES (
    '赏金猎人平台',
    '基于任务的协作平台',
    '',
    true,
    false,
    10,
    'user',
    false,
    '',
    587,
    '',
    '',
    true
) ON CONFLICT DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_system_config_updated_at();