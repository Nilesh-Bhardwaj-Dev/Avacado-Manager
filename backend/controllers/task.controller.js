/**
 * @file task.controller.js
 * @description Business logic for tasks, subtasks, and comments.
 * Exports: getAllTasks, createTask, updateTask, deleteTask,
 *          addSubtask, updateSubtask, deleteSubtask, addComment
 */
import { getDB } from '../config/db.js';
import { logActivity } from '../utils/activity.util.js';
import { sendNotification } from '../utils/notification.util.js';
import { parseBase64Payload } from '../utils/base64.util.js';
import { storeAsset } from '../utils/asset-storage.util.js';

// ─────────────────────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/tasks
 * Returns all tasks in the database.
 */
export async function getAllTasks(req, res, next) {
  try {
    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : (req.user.accountRole === 'user' ? req.user.managedBy : null);
    const query = ownerId ? { ownerId } : {};
    const tasks = await db.collection('tasks').find(query).toArray();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks
 * Creates a new task. Logs the creation activity.
 */
export async function createTask(req, res, next) {
  try {
    const { title, description, team, assigneeId, priority, status, dueDate, tags } = req.body;

    if (!title || !team || !priority || !status || !dueDate) {
      return res.status(400).json({
        error: 'Title, team, priority, status, and due date are required.',
      });
    }

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const id = 'task-' + Date.now();
    const taskDoc = {
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
      ownerId,
    };

    await db.collection('tasks').insertOne(taskDoc);

    // Resolve assignee name for activity log
    let assigneeName = 'Unassigned';
    if (assigneeId) {
      const assignee = await db.collection('users').findOne({ id: assigneeId, managedBy: ownerId });
      if (assignee) assigneeName = assignee.name;
    }

    await logActivity(`${req.user.name} created task '${title}' assigned to ${assigneeName}`, ownerId);

    // Send notification to assignee if assigned
    if (assigneeId && assigneeId !== req.user.id) {
      await sendNotification({
        type: 'TASK_ASSIGNED',
        recipientId: assigneeId,
        title: 'New Task Assigned',
        message: `${req.user.name} assigned you "${title}"`,
        taskId: id,
        ownerId,
      });
    }

    res.status(201).json(taskDoc);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:id
 * Updates an existing task. Logs status change or general update.
 */
export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, team, assigneeId, priority, status, dueDate, tags } = req.body;

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const existing = await db.collection('tasks').findOne({ id, ownerId });

    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Dependency blocking: prevent advancing a blocked task
    if (status && existing.status !== status && ['progress', 'review', 'done'].includes(status)) {
      const deps = existing.dependencies || [];
      if (deps.length > 0) {
        const blockingTasks = await db.collection('tasks').find({
          id: { $in: deps },
          status: { $ne: 'done' }
        }).toArray();

        if (blockingTasks.length > 0) {
          const names = blockingTasks.map(t => t.title).join(', ');
          return res.status(400).json({
            error: `Cannot change status — task is blocked by incomplete dependencies: ${names}`
          });
        }
      }
    }

    await db.collection('tasks').updateOne(
      { id, ownerId },
      { $set: { title, description, team, assigneeId, priority, status, dueDate, tags: tags || [] } }
    );

    // Log different messages depending on whether status changed
    if (existing.status !== status) {
      await logActivity(
        `${req.user.name} moved '${title}' from ${existing.status.toUpperCase()} to ${status.toUpperCase()}`,
        ownerId
      );
    } else {
      await logActivity(`${req.user.name} updated task '${title}'`, ownerId);
    }

    // Notifications on status change
    if (existing.status !== status && existing.assigneeId && existing.assigneeId !== req.user.id) {
      await sendNotification({
        type: 'TASK_UPDATED',
        recipientId: existing.assigneeId,
        title: 'Task Status Changed',
        message: `${req.user.name} moved "${title}" to ${status.toUpperCase()}`,
        taskId: id,
        ownerId,
      });
    }

    // When task moves to done, check dependent tasks for unblocking
    if (status === 'done' && existing.status !== 'done') {
      const dependentTasks = await db.collection('tasks')
        .find({ dependencies: id, ownerId })
        .toArray();

      for (const depTask of dependentTasks) {
        const allDeps = depTask.dependencies || [];
        const incompleteDeps = await db.collection('tasks').find({
          id: { $in: allDeps },
          status: { $ne: 'done' }
        }).toArray();

        if (incompleteDeps.length === 0 && depTask.assigneeId) {
          await sendNotification({
            type: 'DEPENDENCY_UNBLOCKED',
            recipientId: depTask.assigneeId,
            title: 'Task Unblocked',
            message: `"${depTask.title}" is no longer blocked — all dependencies are complete`,
            taskId: depTask.id,
            ownerId,
          });
        }
      }
    }

    // Notification if assignee changed
    if (assigneeId && existing.assigneeId !== assigneeId && assigneeId !== req.user.id) {
      await sendNotification({
        type: 'TASK_ASSIGNED',
        recipientId: assigneeId,
        title: 'Task Assigned to You',
        message: `${req.user.name} assigned you "${title}"`,
        taskId: id,
        ownerId,
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id
 * Permanently deletes a task and logs the action.
 */
export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;

    const task = await db.collection('tasks').findOne({ id, ownerId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await db.collection('tasks').deleteOne({ id, ownerId });
    await logActivity(`${req.user.name} deleted task '${task.title}'`, ownerId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBTASKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/tasks/:id/subtasks
 * Appends a new subtask checklist item to the task.
 */
export async function addSubtask(req, res, next) {
  try {
    const { id: taskId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Subtask title is required.' });
    }

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const task = await db.collection('tasks').findOne({ id: taskId, ownerId });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const id = 'sub-' + Date.now();
    const subtask = { id, title: title.trim(), done: false };

    await db.collection('tasks').updateOne(
      { id: taskId, ownerId },
      { $push: { subtasks: subtask } }
    );

    await logActivity(`${req.user.name} added checklist item '${title}' to '${task.title}'`, ownerId);

    res.status(201).json(subtask);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tasks/:taskId/subtasks/:id
 * Toggles the done state of a subtask.
 */
export async function updateSubtask(req, res, next) {
  try {
    const { taskId, id } = req.params;
    const { done } = req.body;

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const task = await db.collection('tasks').findOne({ id: taskId, ownerId });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    await db.collection('tasks').updateOne(
      { id: taskId, ownerId, 'subtasks.id': id },
      { $set: { 'subtasks.$.done': done } }
    );

    const subtask = task.subtasks.find((s) => s.id === id);
    const action = done ? 'completed' : 'unchecked';
    await logActivity(`${req.user.name} ${action} subtask '${subtask?.title}' on '${task.title}'`, ownerId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:taskId/subtasks/:id
 * Removes a subtask from the task's subtasks array.
 */
export async function deleteSubtask(req, res, next) {
  try {
    const { taskId, id } = req.params;
    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const task = await db.collection('tasks').findOne({ id: taskId, ownerId });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    await db.collection('tasks').updateOne(
      { id: taskId, ownerId },
      { $pull: { subtasks: { id } } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/tasks/:id/comments
 * Adds a comment authored by the current session user.
 */
export async function addComment(req, res, next) {
  try {
    const { id: taskId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const task = await db.collection('tasks').findOne({ id: taskId, ownerId });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const id = 'c-' + Date.now();
    const author = req.user.name;
    const timestamp = 'Just now';
    const comment = { id, author, content: content.trim(), timestamp };

    await db.collection('tasks').updateOne(
      { id: taskId, ownerId },
      { $push: { comments: comment } }
    );

    await logActivity(`${author} commented on task '${task.title}'`, ownerId);

    // Notify assignee about new comment (if author is not the assignee)
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      await sendNotification({
        type: 'COMMENT_ADDED',
        recipientId: task.assigneeId,
        title: 'New Comment',
        message: `${author} commented on "${task.title}"`,
        taskId: task.id,
        ownerId,
      });
    }

    // Notify workspace owner (admin) about new comment (if author is not the owner)
    if (task.ownerId && task.ownerId !== req.user.id) {
      await sendNotification({
        type: 'COMMENT_ADDED',
        recipientId: task.ownerId,
        title: 'New Comment on Task',
        message: `${author} commented on "${task.title}"`,
        taskId: task.id,
        ownerId,
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tasks/:id/proof
 * Uploads a proof image file (base64) for task completion.
 */
export async function uploadProof(req, res, next) {
  try {
    const { id: taskId } = req.params;
    const { fileName, fileType, base64 } = req.body;

    if (!fileName || !fileType || !base64) {
      return res.status(400).json({ error: 'fileName, fileType, and base64 data are required.' });
    }

    const db = getDB();
    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    const task = await db.collection('tasks').findOne({ id: taskId, ownerId });
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const { buffer, mimeType } = parseBase64Payload(base64, fileType);
    const stored = await storeAsset({
      buffer,
      fileName,
      mimeType: mimeType || fileType,
      folder: 'task-proofs',
      localPrefix: 'proof-',
    });

    const proofId = 'pr-' + Date.now();
    const proofUrl = stored.url;
    const proof = {
      id: proofId,
      fileName,
      url: proofUrl,
      uploadedBy: req.user.name,
      uploadedAt: new Date(),
    };

    await db.collection('tasks').updateOne(
      { id: taskId, ownerId },
      { $push: { proofs: proof } }
    );

    await logActivity(`${req.user.name} uploaded proof '${fileName}' for task '${task.title}'`, ownerId);

    // Notify admin
    if (req.user.accountRole === 'user' && req.user.managedBy) {
      await sendNotification({
        type: 'PROOF_UPLOADED',
        recipientId: req.user.managedBy,
        title: 'Proof Uploaded',
        message: `${req.user.name} uploaded proof for "${task.title}"`,
        taskId: task.id,
        ownerId: req.user.managedBy,
      });
    }

    res.status(201).json(proof);
  } catch (err) {
    next(err);
  }
}
