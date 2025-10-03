import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('Variables d\'environnement:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('Longueur du mot de passe:', process.env.DB_PASSWORD?.length);

async function test() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Connexion réussie avec .env !');
    await connection.end();
  } catch (err) {
    console.error('❌ Erreur avec .env:', err.message);
    
    // Test avec valeurs en dur
    console.log('\nTest avec valeurs en dur...');
    try {
      const conn2 = await mysql.createConnection({
        host: 'localhost',
        user: 'task_user',
        password: 'task_password',
        database: 'task_manager'
      });
      console.log('✅ Connexion réussie avec valeurs en dur !');
      console.log('➡️  Le problème vient donc du fichier .env');
      await conn2.end();
    } catch (err2) {
      console.error('❌ Erreur même en dur:', err2.message);
    }
  }
}

test();