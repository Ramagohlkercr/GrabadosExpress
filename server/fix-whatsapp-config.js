import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createWhatsappConfig() {
    console.log('🚀 Creating whatsapp_config table...\n');
    
    try {
        // Create whatsapp_config table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whatsapp_config (
                id SERIAL PRIMARY KEY,
                meta_app_id VARCHAR(100),
                meta_app_secret TEXT,
                whatsapp_token TEXT,
                whatsapp_phone_id VARCHAR(50),
                whatsapp_business_id VARCHAR(50),
                webhook_verify_token VARCHAR(100),
                openai_api_key TEXT,
                ia_modelo VARCHAR(50) DEFAULT 'gpt-4o-mini',
                ia_activa BOOLEAN DEFAULT true,
                ia_prompt_sistema TEXT,
                horario_atencion JSONB DEFAULT '{"inicio": "09:00", "fin": "18:00", "dias": [1,2,3,4,5]}',
                mensaje_fuera_horario TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ whatsapp_config table created');

        // Insert default row
        await pool.query(`
            INSERT INTO whatsapp_config (id, ia_prompt_sistema, mensaje_fuera_horario) 
            VALUES (1, 'Sos un asistente de ventas', 'Gracias por tu mensaje. Te responderemos pronto.')
            ON CONFLICT (id) DO NOTHING
        `);
        console.log('✅ Default config inserted');

        // Add envios columns
        const columns = [
            "correo_api_key VARCHAR(255)",
            "correo_agreement VARCHAR(100)",
            "correo_test_mode BOOLEAN DEFAULT true",
            "remitente_nombre VARCHAR(255) DEFAULT 'Grabados Express'",
            "remitente_direccion VARCHAR(255)",
            "remitente_localidad VARCHAR(100)",
            "remitente_provincia VARCHAR(50)",
            "remitente_cp VARCHAR(20)",
            "remitente_telefono VARCHAR(50)",
            "remitente_email VARCHAR(255)",
            "notif_confirmado BOOLEAN DEFAULT true",
            "notif_produccion BOOLEAN DEFAULT true",
            "notif_listo BOOLEAN DEFAULT true",
            "notif_despachado BOOLEAN DEFAULT true",
            "notif_entregado BOOLEAN DEFAULT true"
        ];

        for (const col of columns) {
            const colName = col.split(' ')[0];
            try {
                await pool.query(`ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS ${col}`);
                console.log(`✅ Added column: ${colName}`);
            } catch (err) {
                console.log(`⚠️  Column ${colName}: ${err.message}`);
            }
        }

        // Verify
        const result = await pool.query('SELECT * FROM whatsapp_config WHERE id = 1');
        console.log('\n📋 Config:', result.rows[0] ? 'OK' : 'Empty');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

createWhatsappConfig();
