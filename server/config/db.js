import mysql from 'mysql2/promise';
import { config } from './env.js';
import { logger } from './logger.js';

let pool = null;
let isConnected = false;

export async function getDbPool() {
  if (pool) return pool;

  try {
    // Attempt connecting to MySQL server directly first
    const connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password
    });

    // Auto-create database if not exists
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.name}\`;`);
    await connection.end();

    // Create pool for ligimed database
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      waitForConnections: true,
      connectionLimit: config.db.poolSize,
      queueLimit: 0
    });

    // Verify pool connection
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    isConnected = true;
    logger.info(`MySQL database '${config.db.name}' connected successfully on ${config.db.host}:${config.db.port}`);
    return pool;
  } catch (err) {
    logger.warn(`MySQL connection failed (${err.message}). Database operating in mock/fallback mode.`);
    isConnected = false;
    return null;
  }
}

export function isDbConnected() {
  return isConnected;
}

export async function query(sql, params = []) {
  try {
    const currentPool = await getDbPool();
    if (currentPool && isConnected) {
      const [results] = await currentPool.execute(sql, params);
      return results;
    }
  } catch (err) {
    logger.error(`Database query execution error: ${err.message}`, { sql });
  }
  return null;
}
