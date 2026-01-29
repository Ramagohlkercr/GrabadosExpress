-- ============================================
-- MIGRATION 003: Add extra fields to pedidos
-- ============================================

-- Add localidad and provincia for shipping
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS localidad VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS provincia VARCHAR(255);

-- Add user_id to track who created the order
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;

-- Add costo_envio for shipping cost
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS costo_envio DECIMAL(10,2) DEFAULT 0;

-- Add logo_image to store the logo as base64
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS logo_image TEXT;

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_pedidos_user ON pedidos(user_id);

-- Add historial for status tracking
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS historial JSONB DEFAULT '[]';
