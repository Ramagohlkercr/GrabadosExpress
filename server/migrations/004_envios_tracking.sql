-- ============================================
-- GRABADOS EXPRESS - Envíos y Tracking
-- Integración completa con Correo Argentino + WhatsApp
-- ============================================

-- Agregar campos de envío a pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_estado VARCHAR(50) DEFAULT 'pendiente';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_tracking VARCHAR(100);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_tipo VARCHAR(50) DEFAULT 'sucursal';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_sucursal_id VARCHAR(50);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_sucursal_nombre VARCHAR(255);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_costo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_etiqueta_pdf TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_fecha_despacho TIMESTAMP WITH TIME ZONE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_fecha_entrega_estimada TIMESTAMP WITH TIME ZONE;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_ultimo_evento TEXT;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_eventos JSONB DEFAULT '[]';

-- Agregar localidad al cliente si no existe
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS localidad VARCHAR(255);

-- ============================================
-- HISTORIAL DE NOTIFICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones_enviadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL, -- 'confirmacion', 'produccion', 'listo', 'despachado', 'entregado', 'tracking'
    canal VARCHAR(20) NOT NULL, -- 'whatsapp', 'email', 'sms'
    telefono VARCHAR(50),
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'enviado', -- 'enviado', 'entregado', 'leido', 'error'
    wa_message_id VARCHAR(100),
    error_mensaje TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_pedido ON notificaciones_enviadas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_cliente ON notificaciones_enviadas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones_enviadas(tipo);

-- ============================================
-- PLANTILLAS DE MENSAJES WHATSAPP
-- ============================================
CREATE TABLE IF NOT EXISTS plantillas_notificacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Lista de variables: {nombre}, {tracking}, etc.
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar plantillas por defecto
INSERT INTO plantillas_notificacion (codigo, nombre, mensaje, variables) VALUES
(
    'pedido_confirmado',
    'Pedido Confirmado',
    '¡Hola {nombre}! 👋

Tu pedido #{numero} fue confirmado ✅

📦 {items}
💰 Total: ${total}

Tiempo estimado de entrega: {dias_entrega} días hábiles.

Te avisamos cuando esté listo para despachar. ¡Gracias por confiar en Grabados Express! 🔥',
    '["nombre", "numero", "items", "total", "dias_entrega"]'
),
(
    'pedido_produccion',
    'En Producción',
    '¡Hola {nombre}! 

Tu pedido #{numero} ya está en producción 🔧✨

Te avisamos apenas esté listo para enviar.',
    '["nombre", "numero"]'
),
(
    'pedido_listo',
    'Pedido Listo',
    '¡{nombre}, tu pedido está listo! 🎉

Pedido #{numero} terminado y listo para despachar.

Lo enviamos hoy o mañana a primera hora. Te paso el tracking apenas salga 📦',
    '["nombre", "numero"]'
),
(
    'pedido_despachado',
    'Pedido Despachado',
    '¡{nombre}, tu pedido ya viaja hacia vos! 🚚

📦 Pedido: #{numero}
📮 Código de seguimiento: {tracking}

Podés seguir tu envío acá:
🔗 https://www.correoargentino.com.ar/formularios/ondnc?id={tracking}

El envío llega a {sucursal}. Te aviso cuando esté disponible para retirar 👌',
    '["nombre", "numero", "tracking", "sucursal"]'
),
(
    'pedido_en_camino',
    'En Camino',
    '¡{nombre}! Tu pedido #{numero} está en camino 🛵

Código de seguimiento: {tracking}
Último estado: {ultimo_evento}

🔗 Seguilo acá: https://www.correoargentino.com.ar/formularios/ondnc?id={tracking}',
    '["nombre", "numero", "tracking", "ultimo_evento"]'
),
(
    'pedido_disponible_retiro',
    'Disponible para Retiro',
    '¡{nombre}! 🎉 Tu pedido ya está en la sucursal!

📦 Pedido: #{numero}
📍 Sucursal: {sucursal}
📮 Código: {tracking}

Recordá llevar tu DNI para retirarlo. ¡Gracias por tu compra! 🙌',
    '["nombre", "numero", "sucursal", "tracking"]'
),
(
    'pedido_entregado',
    'Pedido Entregado',
    '¡{nombre}! Confirmamos que tu pedido #{numero} fue entregado ✅

¡Gracias por confiar en Grabados Express! 🔥

Si te gustó el producto, nos ayuda mucho una reseña o recomendación 💛

¿Alguna consulta? Estamos acá para ayudarte.',
    '["nombre", "numero"]'
)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- CONFIGURACIÓN DE CORREO ARGENTINO (en whatsapp_config)
-- ============================================
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS correo_api_key VARCHAR(255);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS correo_agreement VARCHAR(100);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS correo_test_mode BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_nombre VARCHAR(255) DEFAULT 'Grabados Express';
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_direccion VARCHAR(255);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_localidad VARCHAR(100);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_provincia VARCHAR(50);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_cp VARCHAR(20);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_telefono VARCHAR(50);
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS remitente_email VARCHAR(255);

-- Notificaciones automáticas
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS notif_confirmado BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS notif_produccion BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS notif_listo BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS notif_despachado BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS notif_entregado BOOLEAN DEFAULT true;

-- ============================================
-- VISTA RESUMEN DE ENVÍOS
-- ============================================
CREATE OR REPLACE VIEW vista_envios AS
SELECT 
    p.id,
    p.numero,
    p.estado,
    p.envio_estado,
    p.envio_tracking,
    p.envio_tipo,
    p.envio_sucursal_nombre,
    p.envio_fecha_despacho,
    p.envio_ultimo_evento,
    p.total,
    c.nombre as cliente_nombre,
    c.telefono as cliente_telefono,
    c.localidad as cliente_localidad,
    c.provincia as cliente_provincia,
    p.created_at
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_id = c.id
WHERE p.envio_tracking IS NOT NULL
ORDER BY p.envio_fecha_despacho DESC;
