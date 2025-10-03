const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../frontend'));

// Validation
const allowedStatuses = ['pending', 'in_progress', 'completed'];
const allowedPriorities = ['low', 'medium', 'high'];

// Routes
app.get('/tasks', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM tasks ORDER BY id DESC');
  res.json(rows);
});

app.post('/tasks', async (req, res) => {
  const { title, description = null, status, priority } = req.body;

  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  if (!allowedPriorities.includes(priority)) return res.status(400).json({ error: 'Priorité invalide' });

  const [result] = await db.query(
    'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
    [title, description, status, priority]
  );
  res.json({ id: result.insertId, title, description, status, priority });
});

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description = null, status, priority } = req.body;

  if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });
  if (!allowedPriorities.includes(priority)) return res.status(400).json({ error: 'Priorité invalide' });

  await db.query(
    'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ? WHERE id = ?',
    [title, description, status, priority, id]
  );
  res.json({ id, title, description, status, priority });
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM tasks WHERE id = ?', [id]);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
