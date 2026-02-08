import pg from 'pg';

const pool = new pg.Pool({
    connectionString: 'postgresql://neondb_owner:npg_HA8VmXPsrK1I@ep-autumn-smoke-aclddgv7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'whatsapp_config'`);
    console.log('Columnas existentes:');
    r.rows.forEach(row => console.log('  -', row.column_name, ':', row.data_type));
    await pool.end();
}
check();
