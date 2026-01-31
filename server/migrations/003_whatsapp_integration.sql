-- ============================================
-- GRABADOS EXPRESS - WhatsApp Integration
-- Tables for WhatsApp Business API + AI
-- ============================================

-- Conversaciones de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversaciones (
    id SERIAL PRIMARY KEY,
    wa_id VARCHAR(50) NOT NULL,               -- WhatsApp ID del contacto
    telefono VARCHAR(20) NOT NULL,            -- Número de teléfono
    nombre VARCHAR(255),                       -- Nombre del contacto
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'activa',       -- activa, cerrada, spam
    ultimo_mensaje TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensajes_sin_leer INTEGER DEFAULT 0,
    contexto_ia JSONB DEFAULT '{}',           -- Contexto para la IA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mensajes de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INTEGER REFERENCES whatsapp_conversaciones(id) ON DELETE CASCADE,
    wa_message_id VARCHAR(100),               -- ID del mensaje en WhatsApp
    direccion VARCHAR(10) NOT NULL,           -- 'entrante' o 'saliente'
    tipo VARCHAR(20) DEFAULT 'text',          -- text, image, document, audio, template
    contenido TEXT,                           -- Texto del mensaje
    media_url TEXT,                           -- URL de media si aplica
    metadata JSONB DEFAULT '{}',              -- Datos adicionales
    estado VARCHAR(20) DEFAULT 'enviado',     -- enviado, entregado, leido, fallido
    es_automatico BOOLEAN DEFAULT false,      -- Si fue respondido por IA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plantillas de WhatsApp aprobadas
CREATE TABLE IF NOT EXISTS whatsapp_plantillas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50),                    -- marketing, utility, authentication
    idioma VARCHAR(10) DEFAULT 'es_AR',
    componentes JSONB NOT NULL,               -- Estructura de la plantilla
    estado VARCHAR(20) DEFAULT 'pendiente',   -- pendiente, aprobada, rechazada
    meta_template_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log de interacciones de IA
CREATE TABLE IF NOT EXISTS ia_interacciones (
    id SERIAL PRIMARY KEY,
    conversacion_id INTEGER REFERENCES whatsapp_conversaciones(id) ON DELETE CASCADE,
    mensaje_entrada TEXT NOT NULL,
    mensaje_salida TEXT,
    intencion_detectada VARCHAR(50),          -- consulta, cotizacion, confirmar_pedido, reclamo, etc
    entidades_extraidas JSONB DEFAULT '{}',   -- Datos extraídos del mensaje
    confianza DECIMAL(3,2),                   -- Score de confianza 0-1
    accion_tomada VARCHAR(100),               -- crear_pedido, enviar_cotizacion, escalar, etc
    tokens_usados INTEGER,
    modelo_usado VARCHAR(50),
    tiempo_respuesta_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuración de WhatsApp/IA por usuario
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id SERIAL PRIMARY KEY,
    meta_app_id VARCHAR(100),
    meta_app_secret TEXT,
    whatsapp_token TEXT,                      -- Token de acceso permanente
    whatsapp_phone_id VARCHAR(50),            -- ID del número de WhatsApp Business
    whatsapp_business_id VARCHAR(50),         -- ID de la cuenta de Business
    webhook_verify_token VARCHAR(100),
    openai_api_key TEXT,                      -- API Key de OpenAI
    ia_modelo VARCHAR(50) DEFAULT 'gpt-4o-mini',
    ia_activa BOOLEAN DEFAULT true,
    ia_prompt_sistema TEXT,                   -- Prompt personalizado
    horario_atencion JSONB DEFAULT '{"inicio": "09:00", "fin": "18:00", "dias": [1,2,3,4,5]}',
    mensaje_fuera_horario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_wa_conv_wa_id ON whatsapp_conversaciones(wa_id);
CREATE INDEX IF NOT EXISTS idx_wa_conv_telefono ON whatsapp_conversaciones(telefono);
CREATE INDEX IF NOT EXISTS idx_wa_conv_cliente ON whatsapp_conversaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON whatsapp_mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_wa_msg_created ON whatsapp_mensajes(created_at);
CREATE INDEX IF NOT EXISTS idx_ia_conv ON ia_interacciones(conversacion_id);

-- Insertar configuración por defecto
INSERT INTO whatsapp_config (id, ia_prompt_sistema, mensaje_fuera_horario) 
VALUES (
    1,
    'Eres el asistente virtual de Grabados Express, un negocio de grabado láser personalizado. 
Tu rol es:
1. Responder consultas sobre productos (etiquetas, llaveros, grabados personalizados)
2. Dar información de precios y tiempos de entrega
3. Ayudar a crear cotizaciones
4. Confirmar pedidos cuando el cliente está listo
5. Derivar a un humano cuando sea necesario

Sé amable, profesional y conciso. Usa emojis moderadamente.
Si el cliente confirma un pedido, extrae: productos, cantidades, material, y si tiene logo.',
    'Hola! 👋 Gracias por contactarnos. En este momento estamos fuera de horario de atención (Lun-Vie 9:00-18:00). Te responderemos a la brevedad. ¡Gracias por tu paciencia!'
)
ON CONFLICT (id) DO NOTHING;
