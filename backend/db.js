const { Pool } = require('pg');

const pool = new Pool({
  host: 'dpg-d3ge960gjchc739mimt0-a',
  port: 5432,
  database: 'taskdb_xhyz',
  user: 'taskdb_xhyz_user',
  password: 'kN2gW5wusKdPxLUpctrSBpFdyo7gCCJ8',
  ssl: {
    rejectUnauthorized: false // Render nécessite SSL, mais pas de vérification du certificat
  }
});

module.exports = pool;
