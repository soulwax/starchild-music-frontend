// File: copy-db.ts

import 'dotenv/config';
import postgres from 'postgres';

const DB_URL_ORIGIN = process.env.DB_URL_ORIGIN;
const DB_URL_TARGET = process.env.DB_URL_TARGET;

async function copyDatabase() {
  if (!DB_URL_ORIGIN) {
    throw new Error('Missing DB_URL_ORIGIN environment variable.');
  }
  if (!DB_URL_TARGET) {
    throw new Error('Missing DB_URL_TARGET environment variable.');
  }

  const sourceSql = postgres(DB_URL_ORIGIN, { max: 10 });
  const targetSql = postgres(DB_URL_TARGET, { max: 10 });

  try {
    console.log('🔍 Discovering tables in source database...');
    
    // Get all tables from source database (excluding system tables)
    const tables = await sourceSql<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log(`📋 Found ${tables.length} tables: ${tables.map(t => t.tablename).join(', ')}\n`);

    // Copy schema structure for each table
    console.log('📐 Copying table structures...');
    for (const { tablename } of tables) {
      console.log(`  Creating table: ${tablename}`);
      
      // Get CREATE TABLE statement from source
      const createTableResult = await sourceSql`
        SELECT 
          'CREATE TABLE IF NOT EXISTS ' || quote_ident(tablename) || ' (' ||
          string_agg(
            quote_ident(attname) || ' ' || 
            format_type(atttypid, atttypmod) ||
            CASE WHEN attnotnull THEN ' NOT NULL' ELSE '' END ||
            CASE WHEN atthasdef THEN ' DEFAULT ' || pg_get_expr(adbin, adrelid) ELSE '' END,
            ', '
          ) || 
          ')' as create_statement
        FROM pg_attribute a
        LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
        WHERE attrelid = quote_ident(${tablename})::regclass
          AND attnum > 0 
          AND NOT attisdropped
        GROUP BY tablename
      `;

      if (createTableResult[0]?.create_statement) {
        await targetSql.unsafe(createTableResult[0].create_statement);
      }
    }

    // Copy data for each table
    console.log('\n📦 Copying data...');
    for (const { tablename } of tables) {
      const rowCount = await sourceSql`SELECT COUNT(*) as count FROM ${sourceSql(tablename)}`;
      const count = parseInt(rowCount[0].count);
      
      if (count === 0) {
        console.log(`  ⏭️  ${tablename}: 0 rows (skipped)`);
        continue;
      }

      console.log(`  📥 ${tablename}: ${count} rows`);
      
      // Fetch all data from source
      const data = await sourceSql`SELECT * FROM ${sourceSql(tablename)}`;
      
      if (data.length > 0) {
        // Insert in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          await targetSql`INSERT INTO ${targetSql(tablename)} ${targetSql(batch)}`;
        }
      }
    }

    console.log('\n✅ Database copy completed successfully!');
  } catch (error) {
    console.error('❌ Error during copy:', error);
    throw error;
  } finally {
    await sourceSql.end();
    await targetSql.end();
  }
}

copyDatabase();
