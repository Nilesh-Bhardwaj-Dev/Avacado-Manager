/**
 * @file orgTask.controller.js
 * @description Project-scoped task endpoints (RBAC).
 */
import { getDB } from '../config/db.js';
import { logActivity } from '../utils/activity.util.js';
import { sendNotification } from '../utils/notification.util.js';
import { resolveTaskScope, applyTaskScopeFields, taskIdQuery } from '../utils/taskScope.util.js';

export async function getProjectTasks(req, res, next) {
  try {
    const db = getDB();
    const scope = await resolveTaskScope(req);
    const tasks = await db.collection('tasks').find(scope.query).toArray();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function createProjectTask(req, res, next) {
  try {
    const { title, description, team, assigneeId, priority, status, dueDate, tags } = req.body;
    if (!title || !team || !priority || !status || !dueDate) {
      return res.status(400).json({
        error: 'Title, team, priority, status, and due date are required.',
      });
    }

    const db = getDB();
    const scope = await resolveTaskScope(req);
    const id = `task-${Date.now()}`;

    const taskDoc = applyTaskScopeFields(
      {
        id,
        title,
        description: description || '',
        team,
        assigneeId: assigneeId || null,
        priority,
        status,
        dueDate,
        createdAt: new Date(),
        tags: tags || [],
        subtasks: [],
        comments: [],
        dependencies: [],
      },
      scope
    );

    await db.collection('tasks').insertOne(taskDoc);

    if (scope.ownerId) {
      await logActivity(
        `${req.user.name} created task '${title}'`,
        scope.ownerId
      );
    }

    if (assigneeId && assigneeId !== req.user.id) {
      await sendNotification({
        type: 'TASK_ASSIGNED',
        recipientId: assigneeId,
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you "${title}"`,
        taskId: id,
        ownerId: scope.ownerId,
      });
    }

    res.status(201).json(taskDoc);
  } catch (err) {
    next(err);
  }
}

export async function updateProjectTask(req, res, next) {
  try {
    const db = getDB();
    const scope = await resolveTaskScope(req);
    const existing = await db.collection('tasks').findOne(taskIdQuery(scope.query, req.params.id));
    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    const updates = { ...req.body };
    delete updates.id;
    delete updates.organizationId;
    delete updates.projectId;
    delete updates.ownerId;

    await db.collection('tasks').updateOne(taskIdQuery(scope.query, req.params.id), { $set: updates });

    if (scope.ownerId) {
      await logActivity(`${req.user.name} updated task '${updates.title || existing.title}'`, scope.ownerId);
    }

    const updated = await db.collection('tasks').findOne(taskIdQuery(scope.query, req.params.id));
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectTask(req, res, next) {
  try {
    const db = getDB();
    const scope = await resolveTaskScope(req);
    const task = await db.collection('tasks').findOne(taskIdQuery(scope.query, req.params.id));
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    await db.collection('tasks').deleteOne(taskIdQuery(scope.query, req.params.id));

    if (scope.ownerId) {
      await logActivity(`${req.user.name} deleted task '${task.title}'`, scope.ownerId);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
