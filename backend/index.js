const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

// --- Initialisation de la table ---
async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed')),
        priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "tasks" prête');
  } catch (err) {
    console.error('❌ Erreur lors de la création de la table:', err);
  }
}
initDB();

// Validation
const allowedStatuses = ['pending', 'in_progress', 'completed'];
const allowedPriorities = ['low', 'medium', 'high'];

// --- Routes ---
app.get('/tasks', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tasks ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/tasks', async (req, res) => {
  const { title, description = null, status, priority } = req.body;

  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  if (!allowedPriorities.includes(priority)) return res.status(400).json({ error: 'Priorité invalide' });

  try {
    const result = await db.query(
      'INSERT INTO tasks (title, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, status, priority]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de l’ajout de la tâche' });
  }
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description = null, status, priority } = req.body;

  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  if (!allowedPriorities.includes(priority)) return res.status(400).json({ error: 'Priorité invalide' });

  try {
    const result = await db.query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4 WHERE id = $5 RETURNING *',
      [title, description, status, priority, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
