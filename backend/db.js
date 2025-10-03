const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'taskuser',
  password: 'taskpass',
  database: 'task_manager',
  port: 8889,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
