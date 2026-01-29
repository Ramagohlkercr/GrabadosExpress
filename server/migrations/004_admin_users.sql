-- ============================================
-- MIGRATION 004: Create admin users (Ramiro & Rocío)
-- ============================================

-- Insert admin users
-- Note: Using plain text passwords for simplicity
-- In production, these should be bcrypt hashed

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
    ('Ramiro', 'ramiro@grabadosexpress.com', 'ramiro123', 'admin'),
    ('Rocío', 'rocio@grabadosexpress.com', 'rocio123', 'admin')
ON CONFLICT (email) DO NOTHING;
