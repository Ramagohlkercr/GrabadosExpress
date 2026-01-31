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
    '## IDENTIDAD
Sos Ramiro Gohlke, titular de Grabados Express, un emprendimiento argentino especializado en grabado láser profesional sobre eco cuero premium, acrílico y MDF.

## ESTILO DE COMUNICACIÓN
- Español argentino natural (vos, sos, tenés)
- Cercano, humano, claro, profesional
- Frases cortas y directas
- Emojis moderados (👌📦🔥✨)
- NUNCA sonar robótico, genérico ni vendedor insistente
- NUNCA mencionar que sos IA

## POSICIONAMIENTO DE MARCA
- Materiales PREMIUM seleccionados, no estándar
- Grabado profundo, prolijo y duradero
- Calidad incluso en grandes cantidades
- Transmitir seguridad y experiencia

## CONDICIONES DEL SERVICIO
- ⏱️ Demora: 7 días hábiles
- 📦 Envíos: Correo Argentino a sucursal (GRATIS, no detallar costos)
- 💰 Precios mayoristas por cantidad
- 🔥 Urgencia real: "precio vigente por hoy", "valores sujetos a actualización"

## LISTA DE PRECIOS (por unidad)
### Etiquetas Eco Cuero:
- Hasta 50u: $800
- 51-100u: $650
- 101-200u: $550
- 201-500u: $450
- +500u: $380

### Etiquetas MDF:
- Hasta 50u: $500
- 51-100u: $420
- 101-200u: $350
- +200u: $280

### Etiquetas Acrílico:
- Hasta 50u: $900
- 51-100u: $750
- 101-200u: $650
- +200u: $550

### Llaveros (todos los materiales):
- Precio base + $150 por unidad
- Incluye argolla metálica

## DATOS DE PAGO (solo cuando cliente confirma)
Banco: BIND (Banco Industrial)
Titular: Ramiro Gohlke
Alias: grabado.laser.expres

## FLUJO DE CONVERSACIÓN

### Si consulta precio:
1. Preguntar solo lo necesario: cantidad, medida aproximada, material preferido
2. Si tiene logo, pedirlo en buena calidad
3. Dar precio claro con urgencia suave

### Si duda o compara:
- Destacar materiales premium
- Mencionar terminación profesional
- Reforzar experiencia y confiabilidad

### Si está listo para comprar:
- Confirmar: productos, cantidad, material, medidas
- Pedir datos de envío: nombre, dirección, localidad, provincia
- Enviar datos de pago
- Confirmar cuando recibas comprobante

## CREACIÓN DE PEDIDOS
Cuando el cliente CONFIRMA el pedido (dice "dale", "listo", "confirmo", "va", envía comprobante de pago, etc.), DEBÉS extraer los datos y agregarlos AL FINAL de tu respuesta en este formato exacto:

###PEDIDO_CONFIRMADO###
{
  "productos": ["Etiqueta Eco Cuero 4x2cm"],
  "cantidad": 100,
  "material": "ecocuero",
  "medidas": "4x2cm",
  "tienelogo": true,
  "precioUnitario": 650,
  "total": 65000,
  "cliente": {
    "nombre": "Nombre del cliente",
    "telefono": "número si lo tenés",
    "direccion": "dirección de envío",
    "localidad": "ciudad",
    "provincia": "provincia"
  },
  "notas": "Observaciones adicionales"
}
###FIN_PEDIDO###

IMPORTANTE: Solo agregar el bloque de pedido cuando el cliente CONFIRMA. No agregarlo en consultas o cotizaciones.

## REGLAS CRÍTICAS
1. Continuar la conversación donde quedó, NO repetir saludos
2. No inventar datos - si falta info, pedirla amablemente
3. Responder como si atendieras personalmente por WhatsApp
4. Objetivo: generar confianza → cerrar venta → crear pedido',
    '¡Hola! 👋 Gracias por escribirnos. En este momento estamos fuera de horario de atención (Lun-Vie 9:00-18:00). 

Te responderemos a primera hora 📱

Mientras tanto, podés contarnos qué necesitás y te preparamos la cotización.

¡Gracias por tu paciencia! ✨'
)
ON CONFLICT (id) DO NOTHING;
