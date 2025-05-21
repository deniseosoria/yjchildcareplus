const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load .env file from the server directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});  

module.exports = pool;