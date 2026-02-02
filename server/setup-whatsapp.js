// ============================================
// SETUP WHATSAPP NUMBER
// Run: node server/setup-whatsapp.js
// ============================================

import pg from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_HA8VmXPsrK1I@ep-autumn-smoke-aclddgv7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupWhatsApp() {
    console.log('🔧 Configurando WhatsApp...\n');

    try {
        // Configurar número de negocio
        const negocioConfig = {
            nombreNegocio: 'Grabados Express',
            telefono: '3412278217',
            whatsapp: '3412278217',
            email: '',
            direccion: ''
        };

        await pool.query(
            `INSERT INTO configuracion (key, value) VALUES ('negocio', $1)
            ON CONFLICT (key) DO UPDATE SET value = $1`,
            [JSON.stringify(negocioConfig)]
        );

        console.log('✅ Número de WhatsApp configurado: 3412278217');

        // Verificar
        const result = await pool.query("SELECT value FROM configuracion WHERE key = 'negocio'");
        console.log('\n📋 Configuración guardada:', result.rows[0]?.value);

        console.log('\n✨ ¡Listo! El sistema ahora usará tu número para WhatsApp.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

setupWhatsApp();
