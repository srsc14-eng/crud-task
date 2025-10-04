const tasksContainer = document.getElementById('tasksContainer');
const notification = document.getElementById('notification');
let tasks = [];

// Gestion de la photo
document.getElementById('photoInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      document.getElementById('photoPreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Affichage des tâches
function renderTasks() {
  tasksContainer.innerHTML = '';
  if (tasks.length === 0) {
    tasksContainer.innerHTML = `<div class="empty-state">
      <h3>Aucune tâche</h3>
      <p>Ajoutez votre première tâche pour commencer.</p>
    </div>`;
    return;
  }

  tasks.forEach((task, index) => {
    const taskCard = document.createElement('div');
    taskCard.className = `task-card priority-${task.priority}`;
    taskCard.innerHTML = `
      <div class="task-header">
        <div class="task-title">${task.title}</div>
        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
      </div>
      <div class="task-meta">
        <span class="badge status-${task.status}">${task.status.replace('_',' ')}</span>
        <span class="badge priority-${task.priority}">${task.priority}</span>
      </div>
      <div class="task-actions">
        <button class="btn-edit" onclick="editTask(${task.id})">Modifier</button>
        <button class="btn-delete" onclick="deleteTask(${task.id})">Supprimer</button>
      </div>
    `;
    tasksContainer.appendChild(taskCard);
  });
}

// Notifications
function showNotification(msg, type='success') {
  notification.textContent = msg;
  notification.className = `notification ${type}`;
  setTimeout(() => {
    notification.className = 'notification';
  }, 3000);
}

// Charger les tâches depuis le backend
async function fetchTasks() {
  try {
    const res = await fetch('https://crud-task-pt67.onrender.com/tasks');
    tasks = await res.json();
    renderTasks();
  } catch (err) {
    showNotification('Erreur lors du chargement des tâches', 'error');
    console.error(err);
  }
}

// Ajouter une tâche
document.getElementById('addTaskBtn').addEventListener('click', async () => {
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const status = document.getElementById('status').value;
  const priority = document.getElementById('priority').value;

  if (!title) return showNotification('Le titre est obligatoire', 'error');

  try {
    const res = await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status, priority })
    });
    const newTask = await res.json();
    tasks.push(newTask);

    document.getElementById('title').value = '';
    document.getElementById('description').value = '';
    renderTasks();
    showNotification('Tâche ajoutée ☕');
  } catch (err) {
    showNotification('Erreur lors de l\'ajout', 'error');
    console.error(err);
  }
});

// Supprimer une tâche
async function deleteTask(id) {
  try {
    await fetch(`http://localhost:3000/tasks/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    showNotification('Tâche supprimée');
  } catch (err) {
    showNotification('Erreur lors de la suppression', 'error');
    console.error(err);
  }
}

// Modifier une tâche
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description;
  document.getElementById('status').value = task.status;
  document.getElementById('priority').value = task.priority;

  // Supprime temporairement la tâche pour éviter doublon à l'ajout
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
  showNotification('Modifiez la tâche et cliquez sur Ajouter', 'success');
}

// Initialisation
fetchTasks();
