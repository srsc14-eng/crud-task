import express from 'express';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'task_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de connexions MySQL
let pool;

// Initialisation de la connexion
async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test de connexion
    const connection = await pool.getConnection();
    console.log('✅ Connecté à la base de données MySQL');
    
    // Création de la table si elle n'existe pas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Table tasks prête');
    connection.release();
  } catch (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  }
}

// ========== ROUTES API ==========

// GET - Récupérer toutes les tâches
app.get('/api/tasks', async (req, res) => {
  try {
    console.log('📋 Récupération de toutes les tâches');
    const [rows] = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    console.log(`✅ ${rows.length} tâches récupérées`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Erreur GET /api/tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET - Récupérer une tâche par ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`👤 Récupération de la tâche ID: ${id}`);
    
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      console.log(`❌ Tâche ID ${id} non trouvée`);
      res.status(404).json({ error: 'Tâche non trouvée' });
      return;
    }
    
    console.log(`✅ Tâche ${id} récupérée`);
    res.json(rows[0]);
  } catch (err) {
    console.error(`❌ Erreur GET /api/tasks/${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET - Filtrer les tâches par statut
app.get('/api/tasks/status/:status', async (req, res) => {
  try {
    const status = req.params.status;
    console.log(`🔍 Récupération des tâches avec statut: ${status}`);
    
    const [rows] = await pool.query(
      'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    
    console.log(`✅ ${rows.length} tâches avec statut ${status} récupérées`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Erreur filtrage par statut:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST - Créer une nouvelle tâche
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    console.log(`➕ Création d'une tâche:`, { title, status, priority });
    
    if (!title) {
      console.log('❌ Titre manquant pour la création');
      res.status(400).json({ error: 'Le titre est requis' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
      [title, description || null, status || 'pending', priority || 'medium']
    );
    
    console.log(`✅ Tâche créée avec l'ID: ${result.insertId}`);
    res.status(201).json({
      id: result.insertId,
      title,
      description,
      status: status || 'pending',
      priority: priority || 'medium',
      message: 'Tâche créée avec succès'
    });
  } catch (err) {
    console.error('❌ Erreur POST /api/tasks:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT - Mettre à jour une tâche
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, status, priority } = req.body;
    console.log(`✏️ Mise à jour de la tâche ID: ${id}`, { title, status, priority });

    if (!title) {
      res.status(400).json({ error: 'Le titre est requis' });
      return;
    }

    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ? WHERE id = ?',
      [title, description || null, status || 'pending', priority || 'medium', id]
    );
    
    if (result.affectedRows === 0) {
      console.log(`❌ Tâche ID ${id} non trouvée pour la mise à jour`);
      res.status(404).json({ error: 'Tâche non trouvée' });
      return;
    }
    
    console.log(`✅ Tâche ID ${id} mise à jour`);
    res.json({
      id: parseInt(id),
      title,
      description,
      status,
      priority,
      message: 'Tâche mise à jour avec succès'
    });
  } catch (err) {
    console.error(`❌ Erreur PUT /api/tasks/${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH - Mettre à jour le statut uniquement
app.patch('/api/tasks/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    console.log(`🔄 Changement de statut de la tâche ID: ${id} vers ${status}`);

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({ error: 'Statut invalide' });
      return;
    }

    const [result] = await pool.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      console.log(`❌ Tâche ID ${id} non trouvée`);
      res.status(404).json({ error: 'Tâche non trouvée' });
      return;
    }
    
    console.log(`✅ Statut de la tâche ID ${id} mis à jour`);
    res.json({ message: 'Statut mis à jour avec succès', status });
  } catch (err) {
    console.error(`❌ Erreur PATCH /api/tasks/${req.params.id}/status:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Supprimer une tâche
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log(`🗑️ Suppression de la tâche ID: ${id}`);
    
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      console.log(`❌ Tâche ID ${id} non trouvée pour la suppression`);
      res.status(404).json({ error: 'Tâche non trouvée' });
      return;
    }
    
    console.log(`✅ Tâche ID ${id} supprimée`);
    res.json({ message: 'Tâche supprimée avec succès' });
  } catch (err) {
    console.error(`❌ Erreur DELETE /api/tasks/${req.params.id}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route pour servir la page principale
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialisation et démarrage du serveur
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log('🚀========================================');
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log('🚀========================================');
    console.log('📖 Routes disponibles:');
    console.log('   GET    /                        - Page principale');
    console.log('   GET    /api/tasks               - Toutes les tâches');
    console.log('   GET    /api/tasks/:id           - Tâche par ID');
    console.log('   GET    /api/tasks/status/:status - Filtrer par statut');
    console.log('   POST   /api/tasks               - Créer tâche');
    console.log('   PUT    /api/tasks/:id           - Modifier tâche');
    console.log('   PATCH  /api/tasks/:id/status    - Changer statut');
    console.log('   DELETE /api/tasks/:id           - Supprimer tâche');
    console.log('🚀========================================');
  });
});

// Fermeture propre de la base de données
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  try {
    await pool.end();
    console.log('✅ Pool de connexions fermé.');
  } catch (err) {
    console.error('❌ Erreur fermeture pool:', err.message);
  }
  console.log('👋 Au revoir !');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('💥 Erreur non capturée:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesse rejetée non gérée:', reason);
  process.exit(1);
});