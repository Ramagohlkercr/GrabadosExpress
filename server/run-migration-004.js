import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration004() {
    console.log('🚀 Running migration 004 (admin users)...\n');
    
    try {
        const result = await pool.query(`
            INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
                ('Ramiro', 'ramiro@grabadosexpress.com', 'ramiro123', 'admin'),
                ('Rocío', 'rocio@grabadosexpress.com', 'rocio123', 'admin')
            ON CONFLICT (email) DO NOTHING
            RETURNING *;
        `);
        
        if (result.rows.length > 0) {
            console.log('✅ Usuarios creados:');
            result.rows.forEach(user => {
                console.log(`   - ${user.nombre} (${user.email})`);
            });
        } else {
            console.log('ℹ️  Los usuarios ya existen');
        }
        
        // Verify users
        const users = await pool.query('SELECT id, nombre, email, rol FROM usuarios');
        console.log('\n📋 Usuarios en la base de datos:');
        users.rows.forEach(u => console.log(`   - ${u.id}: ${u.nombre} (${u.email}) - ${u.rol}`));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

runMigration004();
