/**
 * @file user-dashboard.controller.js
 * @description User dashboard endpoints — team members see their own tasks.
 */
import { getDB } from '../config/db.js';
import { sendNotification } from '../utils/notification.util.js';

/**
 * GET /api/user/tasks — returns tasks assigned to the current user
 */
export async function getMyTasks(req, res, next) {
  try {
    const db = getDB();
    const tasks = await db.collection('tasks')
      .find({ assigneeId: req.user.id, ownerId: req.user.managedBy })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/user/tasks/:id/status — user updates status of their own task
 */
export async function updateMyTaskStatus(req, res, next) {
  try {
    const db = getDB();
    const taskId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['todo', 'progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify task is assigned to this user
    const task = await db.collection('tasks').findOne({
      id: taskId,
      assigneeId: req.user.id,
      ownerId: req.user.managedBy
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    // Check dependency blocking
    if (['progress', 'review', 'done'].includes(status)) {
      const deps = task.dependencies || [];
      if (deps.length > 0) {
        const blockingTasks = await db.collection('tasks').find({
          id: { $in: deps },
          status: { $ne: 'done' }
        }).toArray();

        if (blockingTasks.length > 0) {
          const names = blockingTasks.map(t => t.title).join(', ');
          return res.status(400).json({
            error: `This task is blocked by incomplete dependencies: ${names}`
          });
        }
      }
    }

    await db.collection('tasks').updateOne(
      { id: taskId },
      { $set: { status } }
    );

    // If task completed, notify admin and check dependent tasks
    if (status === 'done') {
      // Notify admin
      if (req.user.managedBy) {
        await sendNotification({
          type: 'TASK_COMPLETED',
          recipientId: req.user.managedBy,
          title: 'Task Completed',
          message: `${req.user.name} completed "${task.title}"`,
          taskId: task.id,
          ownerId: req.user.managedBy
        });
      }

      // Check for unblocked dependent tasks
      const dependentTasks = await db.collection('tasks')
        .find({ dependencies: taskId, ownerId: req.user.managedBy })
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
            ownerId: req.user.managedBy
          });
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/user/stats — user's task stats
 */
export async function getMyStats(req, res, next) {
  try {
    const db = getDB();
    const pipeline = [
      { $match: { assigneeId: req.user.id, ownerId: req.user.managedBy } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ];
    const results = await db.collection('tasks').aggregate(pipeline).toArray();

    const stats = { total: 0, todo: 0, progress: 0, review: 0, done: 0, overdue: 0 };

    results.forEach(r => {
      stats[r._id] = r.count;
      stats.total += r.count;
    });

    // Count overdue tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = await db.collection('tasks').countDocuments({
      assigneeId: req.user.id,
      ownerId: req.user.managedBy,
      status: { $ne: 'done' },
      dueDate: { $lt: today.toISOString().split('T')[0] }
    });
    stats.overdue = overdue;

    res.json(stats);
  } catch (err) {
    next(err);
  }
}
