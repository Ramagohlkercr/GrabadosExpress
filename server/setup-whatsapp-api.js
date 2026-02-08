// ============================================
// SETUP WHATSAPP BUSINESS API CREDENTIALS
// Run: node server/setup-whatsapp-api.js
// ============================================

import pg from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_HA8VmXPsrK1I@ep-autumn-smoke-aclddgv7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupWhatsAppAPI() {
    console.log('🔧 Configurando WhatsApp Business API...\n');

    try {
        // Verificar si hay configuración existente
        const existingConfig = await pool.query('SELECT id FROM whatsapp_config LIMIT 1');
        
        if (existingConfig.rows.length > 0) {
            // Actualizar configuración existente
            await pool.query(`
                UPDATE whatsapp_config SET
                    whatsapp_phone_id = $1,
                    whatsapp_business_id = $2,
                    whatsapp_token = $3,
                    webhook_verify_token = $4,
                    ia_activa = $5,
                    ia_modelo = $6,
                    updated_at = NOW()
                WHERE id = $7
            `, [
                '103041821014830',
                '141216066407375',
                'EAAM0usDAkqwBQmfBj2OEaYLN9BZAcgLliE6pTmYcczyo7ez',
                'grabados_express_webhook_2026',
                true,
                'gpt-4o-mini',
                existingConfig.rows[0].id
            ]);
            console.log('✅ Configuración actualizada');
        } else {
            // Insertar nueva configuración
            await pool.query(`
                INSERT INTO whatsapp_config (
                    whatsapp_phone_id, whatsapp_business_id, whatsapp_token,
                    webhook_verify_token, ia_activa, ia_modelo
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                '103041821014830',
                '141216066407375',
                'EAAM0usDAkqwBQmfBj2OEaYLN9BZAcgLliE6pTmYcczyo7ez',
                'grabados_express_webhook_2026',
                true,
                'gpt-4o-mini'
            ]);
            console.log('✅ Configuración insertada');
        }

        // Verificar
        const result = await pool.query('SELECT whatsapp_phone_id, whatsapp_business_id, whatsapp_token, webhook_verify_token, ia_activa FROM whatsapp_config LIMIT 1');
        const config = result.rows[0];
        
        console.log('\n📋 Configuración guardada:');
        console.log('   Phone ID:', config.whatsapp_phone_id);
        console.log('   Business ID:', config.whatsapp_business_id);
        console.log('   Token:', config.whatsapp_token?.substring(0, 25) + '...');
        console.log('   Webhook Verify Token:', config.webhook_verify_token);
        console.log('   IA Activa:', config.ia_activa);

        console.log('\n' + '='.repeat(60));
        console.log('✨ ¡CREDENCIALES CONFIGURADAS CORRECTAMENTE!');
        console.log('='.repeat(60));
        
        console.log('\n📌 PRÓXIMO PASO: Configurar el Webhook en Meta Developers\n');
        console.log('   1. Ir a: https://developers.facebook.com/apps/');
        console.log('   2. Seleccionar tu app > WhatsApp > Configuration');
        console.log('   3. En "Webhook", hacer click en "Edit"');
        console.log('   4. Configurar:');
        console.log('');
        console.log('   📍 Callback URL:');
        console.log('      https://grabados-express.vercel.app/api/whatsapp');
        console.log('');
        console.log('   🔑 Verify Token:');
        console.log('      grabados_express_webhook_2026');
        console.log('');
        console.log('   5. Click en "Verify and Save"');
        console.log('   6. Suscribirse a: messages, message_deliveries, message_reads');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

setupWhatsAppAPI();
