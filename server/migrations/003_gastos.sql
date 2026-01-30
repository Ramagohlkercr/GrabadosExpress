-- ============================================
-- MIGRATION 003: Gastos (Expenses)
-- ============================================

CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria VARCHAR(100) NOT NULL,
    descripcion TEXT,
    monto DECIMAL(12, 2) NOT NULL,
    proveedor VARCHAR(255),
    comprobante VARCHAR(100),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);

-- Insert some sample categories as reference
COMMENT ON TABLE gastos IS 'Registro de gastos del negocio';
