const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const taskTitle = document.getElementById('task-title');
const taskDescription = document.getElementById('task-description');
const taskPriority = document.getElementById('task-priority');
const taskCategory = document.getElementById('task-category');
const taskCompleted = document.getElementById('task-completed');
const formMessage = document.getElementById('form-message');
const submitButton = document.getElementById('submit-button');
const formTitle = document.getElementById('form-title');
const cancelEdit = document.getElementById('cancel-edit');

// Dashboard & Control elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statPercent = document.getElementById('stat-percent');
const progressFill = document.getElementById('progress-fill');
const searchInput = document.getElementById('search-input');
const clearSearch = document.getElementById('clear-search');
const filterTabs = document.querySelectorAll('.tab-btn');

let tasks = [];
let editingTaskId = null;
let currentFilter = 'all';
let searchQuery = '';

function setMessage(message, isError = true) {
  formMessage.textContent = message;
  if (!message) {
    formMessage.className = 'message';
    return;
  }
  
  if (isError) {
    formMessage.style.color = '#f87171';
    formMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
    formMessage.style.border = '1px solid rgba(239, 68, 68, 0.3)';
  } else {
    formMessage.style.color = '#34d399';
    formMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
    formMessage.style.border = '1px solid rgba(16, 185, 129, 0.3)';
  }
}

function resetForm() {
  editingTaskId = null;
  taskForm.reset();
  formTitle.textContent = 'Create Task';
  
  submitButton.innerHTML = `
    <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    <span>Add Task</span>
  `;
  
  cancelEdit.hidden = true;
  setMessage('', false);
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title ?? '',
    description: task.description ?? '',
    priority: (task.priority ?? 'medium').toLowerCase(),
    category: task.category ?? 'General',
    completed: Boolean(task.completed),
  };
}

function updateDashboardStats() {
  const total = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = total - completedCount;
  const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pendingCount;
  if (statCompleted) statCompleted.textContent = completedCount;
  if (statPercent) statPercent.textContent = `${percentage}%`;
  if (progressFill) progressFill.style.width = `${percentage}%`;
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    if (currentFilter === 'pending' && task.completed) return false;
    if (currentFilter === 'completed' && !task.completed) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(q);
      const descMatch = task.description.toLowerCase().includes(q);
      const catMatch = task.category.toLowerCase().includes(q);
      const prioMatch = task.priority.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch || prioMatch;
    }

    return true;
  });
}

function updateCount(filteredCount) {
  const total = tasks.length;
  if (filteredCount !== total) {
    taskCount.textContent = `${filteredCount} of ${total} tasks`;
  } else {
    taskCount.textContent = `${total} task${total === 1 ? '' : 's'}`;
  }
}

function renderTasks() {
  updateDashboardStats();
  const filteredTasks = getFilteredTasks();
  updateCount(filteredTasks.length);

  if (filteredTasks.length === 0) {
    let emptyTitle = 'No tasks found';
    let emptyDesc = 'Get started by creating your first task using the form.';
    
    if (searchQuery) {
      emptyTitle = 'No matching tasks';
      emptyDesc = `No tasks matched "${escapeHtml(searchQuery)}". Try clearing your search.`;
    } else if (currentFilter === 'pending') {
      emptyTitle = 'No pending tasks';
      emptyDesc = 'Great job! You have completed all your tasks.';
    } else if (currentFilter === 'completed') {
      emptyTitle = 'No completed tasks';
      emptyDesc = 'Tasks you complete will show up here.';
    }

    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <h3>${emptyTitle}</h3>
        <p>${emptyDesc}</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filteredTasks
    .slice()
    .sort((left, right) => right.id - left.id)
    .map(
      (task) => `
        <article class="task-item ${task.completed ? 'completed' : ''}">
          <div class="task-header-row">
            <div class="task-main-content">
              <div class="task-title-group">
                <h3>${escapeHtml(task.title)}</h3>
                <div class="badge-group">
                  <span class="badge badge-priority ${task.priority}">${escapeHtml(task.priority)} priority</span>
                  <span class="badge badge-category">${escapeHtml(task.category)}</span>
                </div>
              </div>
              <p>${escapeHtml(task.description || 'No description provided.')}</p>
            </div>
            <span class="task-state ${task.completed ? 'done' : ''}">
              ${task.completed ? 'Completed' : 'Pending'}
            </span>
          </div>

          <div class="task-actions">
            <span class="task-meta">Task #${task.id}</span>
            <div class="task-buttons">
              <button type="button" class="secondary" data-action="toggle" data-id="${task.id}">
                ${
                  task.completed
                    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Undo`
                    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Complete`
                }
              </button>
              <button type="button" class="secondary" data-action="edit" data-id="${task.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button type="button" class="primary" data-action="delete" data-id="${task.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
              </button>
            </div>
          </div>
        </article>
      `,
    )
    .join('');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadTasks() {
  try {
    const response = await fetch('/tasks');
    if (!response.ok) {
      throw new Error('Unable to load tasks.');
    }

    const data = await response.json();
    tasks = data.map(normalizeTask);
    renderTasks();
  } catch (error) {
    setMessage(error.message || 'Unable to load tasks.');
    taskList.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load tasks</h3>
        <p>${escapeHtml(error.message || 'Error communicating with server.')}</p>
      </div>
    `;
  }
}

async function saveTask(event) {
  event.preventDefault();

  const payload = {
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    priority: taskPriority ? taskPriority.value : 'medium',
    category: taskCategory ? taskCategory.value : 'General',
    completed: taskCompleted.checked,
  };

  if (!payload.title) {
    setMessage('Task title is required.');
    return;
  }

  const isEditing = editingTaskId !== null;
  const url = isEditing ? `/tasks/${editingTaskId}` : '/tasks';
  const method = isEditing ? 'PUT' : 'POST';

  try {
    submitButton.disabled = true;
    setMessage('Saving task...', false);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseBody = await response.json().catch(() => null);
      throw new Error(responseBody?.error || 'Task request failed.');
    }

    const savedTask = normalizeTask(await response.json());

    if (isEditing) {
      tasks = tasks.map((task) => (task.id === savedTask.id ? savedTask : task));
      setMessage('Task updated successfully.', false);
    } else {
      tasks = [savedTask, ...tasks];
      setMessage('Task created successfully.', false);
    }

    resetForm();
    renderTasks();
  } catch (error) {
    setMessage(error.message || 'Task request failed.');
  } finally {
    submitButton.disabled = false;
  }
}

async function handleTaskAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const taskId = Number(button.dataset.id);
  const task = tasks.find((currentTask) => currentTask.id === taskId);
  if (!task) return;

  const action = button.dataset.action;

  if (action === 'edit') {
    editingTaskId = task.id;
    taskTitle.value = task.title;
    taskDescription.value = task.description;
    if (taskPriority) taskPriority.value = task.priority;
    if (taskCategory) taskCategory.value = task.category;
    taskCompleted.checked = task.completed;
    formTitle.textContent = 'Edit Task';
    
    submitButton.innerHTML = `
      <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
      </svg>
      <span>Update Task</span>
    `;
    
    cancelEdit.hidden = false;
    setMessage('Editing task...', false);
    taskTitle.focus();
    return;
  }

  try {
    const response = await fetch(`/tasks/${task.id}`, {
      method: action === 'delete' ? 'DELETE' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body:
        action === 'toggle'
          ? JSON.stringify({ completed: !task.completed })
          : undefined,
    });

    if (!response.ok) {
      const responseBody = await response.json().catch(() => null);
      throw new Error(responseBody?.error || 'Task request failed.');
    }

    if (action === 'delete') {
      tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
      if (editingTaskId === task.id) {
        resetForm();
      }
      setMessage('Task deleted successfully.', false);
    } else {
      const updatedTask = normalizeTask(await response.json());
      tasks = tasks.map((currentTask) => (currentTask.id === updatedTask.id ? updatedTask : currentTask));
      setMessage('Task updated successfully.', false);
    }

    renderTasks();
  } catch (error) {
    setMessage(error.message || 'Task request failed.');
  }
}

// Event Listeners for Filters & Search
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (clearSearch) {
      clearSearch.hidden = !searchQuery;
    }
    renderTasks();
  });
}

if (clearSearch) {
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearch.hidden = true;
    searchInput.focus();
    renderTasks();
  });
}

filterTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    filterTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderTasks();
  });
});

taskForm.addEventListener('submit', saveTask);
cancelEdit.addEventListener('click', resetForm);
taskList.addEventListener('click', handleTaskAction);

loadTasks();