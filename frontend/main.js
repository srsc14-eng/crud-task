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

  tasks.forEach((task) => {
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

// Ajouter ou modifier une tâche
async function saveTask(task) {
  try {
    let res, data;
    if (task.id) {
      // Modification
      res = await fetch(`https://crud-task-pt67.onrender.com/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      data = await res.json();
      // Remplace la tâche modifiée dans le tableau local
      tasks = tasks.map(t => t.id === data.id ? data : t);
      showNotification('Tâche modifiée ✨');
    } else {
      // Nouvelle tâche
      res = await fetch('https://crud-task-pt67.onrender.com/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      data = await res.json();
      tasks.push(data);
      showNotification('Tâche ajoutée ☕');
    }
    renderTasks();
  } catch (err) {
    showNotification('Erreur lors de l\'enregistrement', 'error');
    console.error(err);
  }
}

// Ajouter une tâche via le bouton
document.getElementById('addTaskBtn').addEventListener('click', () => {
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const status = document.getElementById('status').value;
  const priority = document.getElementById('priority').value;

  if (!title) return showNotification('Le titre est obligatoire', 'error');

  const editingId = document.getElementById('addTaskBtn').dataset.editingId;
  const task = { title, description, status, priority };
  if (editingId) task.id = parseInt(editingId);

  saveTask(task);

  // Reset formulaire
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('status').value = 'pending';
  document.getElementById('priority').value = 'low';
  document.getElementById('addTaskBtn').removeAttribute('data-editing-id');
});

// Supprimer une tâche
async function deleteTask(id) {
  try {
    await fetch(`https://crud-task-pt67.onrender.com/tasks/${id}`, { method: 'DELETE' });
    tasks = tasks.filter(t => t.id !== id);
    renderTasks();
    showNotification('Tâche supprimée');
  } catch (err) {
    showNotification('Erreur lors de la suppression', 'error');
    console.error(err);
  }
}

// Modifier une tâche (pré-remplir le formulaire)
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('title').value = task.title;
  document.getElementById('description').value = task.description;
  document.getElementById('status').value = task.status;
  document.getElementById('priority').value = task.priority;

  document.getElementById('addTaskBtn').dataset.editingId = task.id;
  showNotification('Modifiez la tâche et cliquez sur Ajouter', 'success');
}

// Initialisation
fetchTasks();
