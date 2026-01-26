-- ============================================
-- GRABADOS EXPRESS - Initial Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTES
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    notas TEXT,
    nombre_marca VARCHAR(255),
    logo_image TEXT,
    logo_nombre VARCHAR(255),
    forma_etiqueta VARCHAR(50),
    medida_ancho DECIMAL(10,2),
    medida_alto DECIMAL(10,2),
    color_preferido VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCTOS
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    material VARCHAR(100),
    precio_base DECIMAL(10,2) DEFAULT 0,
    tiempo_estimado INTEGER DEFAULT 5,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default products
INSERT INTO productos (nombre, categoria, material, precio_base, tiempo_estimado, activo) VALUES
    ('Etiqueta MDF', 'etiqueta', 'mdf', 500, 5, true),
    ('Etiqueta Acrílico', 'etiqueta', 'acrilico', 800, 5, true),
    ('Etiqueta Eco Cuero', 'etiqueta', 'ecocuero', 700, 5, true),
    ('Llavero MDF', 'llavero', 'mdf', 400, 5, true),
    ('Llavero Acrílico', 'llavero', 'acrilico', 600, 5, true),
    ('Llavero Eco Cuero', 'llavero', 'ecocuero', 550, 7, true),
    ('Llavero Acrílico Premium', 'llavero', 'acrilico', 900, 10, true),
    ('Llavero Cuero Genuino', 'llavero', 'cuero', 1000, 7, true);

-- ============================================
-- INSUMOS
-- ============================================
CREATE TABLE IF NOT EXISTS insumos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    unidad VARCHAR(50) DEFAULT 'unidad',
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    costo_unitario DECIMAL(10,2) DEFAULT 0,
    proveedor VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default supplies
INSERT INTO insumos (nombre, unidad, stock, stock_minimo, costo_unitario) VALUES
    ('Plancha MDF 3mm', 'unidad', 10, 3, 5000),
    ('Plancha Acrílico 3mm', 'unidad', 5, 2, 8000),
    ('Plancha Eco Cuero', 'unidad', 8, 2, 6000),
    ('Hilo de nylon', 'metro', 500, 100, 10),
    ('Argollas llavero', 'unidad', 100, 20, 50);

-- ============================================
-- PEDIDOS
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero VARCHAR(20) UNIQUE NOT NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    estado VARCHAR(50) DEFAULT 'cotizacion',
    items JSONB DEFAULT '[]',
    subtotal DECIMAL(10,2) DEFAULT 0,
    descuento DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notas TEXT,
    fecha_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    fecha_entregado TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq START 1;

-- ============================================
-- COTIZACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS cotizaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]',
    total DECIMAL(10,2) DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONFIGURACION
-- ============================================
CREATE TABLE IF NOT EXISTS configuracion (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default configuration
INSERT INTO configuracion (key, value) VALUES
    ('negocio', '{"nombreNegocio": "Grabados Express", "telefono": "", "whatsapp": "", "email": "", "direccion": ""}'),
    ('entregas', '{"diasHabilesEntrega": 7, "diasHabilesMax": 10}'),
    ('precios', '{"margenDefault": 30}'),
    ('materiales', '[{"id": "mdf", "nombre": "MDF", "color": "#D4A574"}, {"id": "acrilico", "nombre": "Acrílico", "color": "#00CED1"}, {"id": "ecocuero", "nombre": "Eco Cuero", "color": "#D2691E"}, {"id": "cuero", "nombre": "Cuero Genuino", "color": "#8B0000"}]'),
    ('categorias', '[{"id": "etiqueta", "nombre": "Etiqueta"}, {"id": "llavero", "nombre": "Llavero"}, {"id": "personalizado", "nombre": "Personalizado"}]');

-- ============================================
-- ENVIOS
-- ============================================
CREATE TABLE IF NOT EXISTS envios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    tipo_servicio VARCHAR(50),
    tracking_number VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'pendiente',
    costo DECIMAL(10,2) DEFAULT 0,
    peso DECIMAL(10,2),
    dimensiones JSONB,
    direccion_destino JSONB,
    sucursal_origen JSONB,
    sucursal_destino JSONB,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_envios_pedido ON envios(pedido_id);
CREATE INDEX IF NOT EXISTS idx_envios_tracking ON envios(tracking_number);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_insumos_updated_at BEFORE UPDATE ON insumos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_envios_updated_at BEFORE UPDATE ON envios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
