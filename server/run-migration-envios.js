import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    console.log('🚀 Running migration 004_envios_tracking.sql...\n');
    
    try {
        const migrationPath = path.join(__dirname, 'migrations', '004_envios_tracking.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by GO or semicolon and execute each statement
        const statements = sql.split(/;\s*$/gm).filter(s => s.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing statement...');
                try {
                    await pool.query(statement);
                    console.log('✅ Success');
                } catch (err) {
                    // Ignore "already exists" errors
                    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                        console.log('⚠️  Already exists, skipping...');
                    } else {
                        throw err;
                    }
                }
            }
        }
        
        console.log('\n✅ Migration completed successfully!');
        
        // Verify columns were added
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'pedidos' AND column_name LIKE 'envio_%'
            ORDER BY column_name
        `);
        
        console.log('\n📋 Columnas de envío en pedidos:');
        result.rows.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));
        
        // Verify new tables
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name IN ('notificaciones_enviadas', 'plantillas_notificacion')
        `);
        
        console.log('\n📋 Tablas creadas:');
        tables.rows.forEach(t => console.log(`   - ${t.table_name}`));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await pool.end();
    }
}

runMigration();
