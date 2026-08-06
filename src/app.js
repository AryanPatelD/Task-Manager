import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');

const tasks = [
  {
    id: 1,
    title: 'Set up project',
    description: 'Create the initial task manager backend structure.',
    priority: 'high',
    category: 'Work',
    completed: false,
  },
];

let nextId = 2;

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(publicPath, 'index.html'));
});

app.get('/tasks', (req, res) => {
  res.status(200).json(tasks);
});

app.post('/tasks', (req, res, next) => {
  try {
    const {
      title = 'Untitled Task',
      description = '',
      priority = 'medium',
      category = 'General',
      completed = false,
    } = req.body;

    const newTask = {
      id: nextId,
      title,
      description,
      priority,
      category,
      completed: Boolean(completed),
    };

    nextId += 1;
    tasks.push(newTask);

    res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
});

app.put('/tasks/:id', (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (!task) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    const { title, description, priority, category, completed } = req.body;

    if (title !== undefined) {
      task.title = title;
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (priority !== undefined) {
      task.priority = priority;
    }

    if (category !== undefined) {
      task.category = category;
    }

    if (completed !== undefined) {
      task.completed = Boolean(completed);
    }

    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
});

app.delete('/tasks/:id', (req, res, next) => {
  try {
    const taskId = Number.parseInt(req.params.id, 10);
    const taskIndex = tasks.findIndex((currentTask) => currentTask.id === taskId);

    if (taskIndex === -1) {
      const error = new Error('Task not found.');
      error.statusCode = 404;
      throw error;
    }

    const [deletedTask] = tasks.splice(taskIndex, 1);
    res.status(200).json(deletedTask);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
  });
});

export default app;