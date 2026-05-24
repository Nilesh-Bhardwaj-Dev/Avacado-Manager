/**
 * @file dependency.controller.js
 * @description Task dependency management with circular dependency detection via DFS.
 */
import { getDB } from '../config/db.js';
import { resolveTaskScope, taskIdQuery } from '../utils/taskScope.util.js';

/**
 * DFS-based cycle detection.
 * Checks if adding an edge from `startNode` → `targetNode` would create a cycle.
 */
function hasCycle(graph, startNode, targetNode) {
  const visited = new Set();
  const stack = [targetNode];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === startNode) return true;
    if (visited.has(node)) continue;
    visited.add(node);
    const neighbors = graph[node] || [];
    for (const n of neighbors) {
      stack.push(n);
    }
  }
  return false;
}

/**
 * POST /api/tasks/:id/dependencies
 * Body: { dependsOnId: string }
 */
export async function addDependency(req, res, next) {
  try {
    const db = getDB();
    const taskId = req.params.id;
    const { dependsOnId } = req.body;

    if (!dependsOnId) return res.status(400).json({ error: 'dependsOnId is required' });
    if (taskId === dependsOnId) return res.status(400).json({ error: 'A task cannot depend on itself' });

    const scope = await resolveTaskScope(req);

    // Verify both tasks exist within the same workspace
    const task = await db.collection('tasks').findOne(taskIdQuery(scope.query, taskId));
    const depTask = await db.collection('tasks').findOne(taskIdQuery(scope.query, dependsOnId));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (!depTask) return res.status(404).json({ error: 'Dependency task not found' });

    // Check if dependency already exists
    const deps = task.dependencies || [];
    if (deps.includes(dependsOnId)) {
      return res.status(400).json({ error: 'Dependency already exists' });
    }

    // Build dependency graph for cycle detection
    const allTasks = await db.collection('tasks').find(scope.query).toArray();
    const graph = {};
    for (const t of allTasks) {
      graph[t.id] = t.dependencies || [];
    }
    // Simulate adding the new edge
    graph[taskId] = [...(graph[taskId] || []), dependsOnId];

    // Check for cycle
    if (hasCycle(graph, taskId, dependsOnId)) {
      return res.status(400).json({ error: 'Adding this dependency would create a circular dependency' });
    }

    // Add dependency
    await db.collection('tasks').updateOne(
      taskIdQuery(scope.query, taskId),
      { $addToSet: { dependencies: dependsOnId } }
    );

    res.json({ success: true, message: `Task now depends on "${depTask.title}"` });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tasks/:id/dependencies/:depId
 */
export async function removeDependency(req, res, next) {
  try {
    const db = getDB();
    const taskId = req.params.id;
    const depId = req.params.depId;
    const scope = await resolveTaskScope(req);

    await db.collection('tasks').updateOne(
      taskIdQuery(scope.query, taskId),
      { $pull: { dependencies: depId } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tasks/:id/dependencies
 * Returns blocking tasks, dependent tasks, blocked status, and progress percentage.
 */
export async function getDependencies(req, res, next) {
  try {
    const db = getDB();
    const taskId = req.params.id;
    const scope = await resolveTaskScope(req);

    const task = await db.collection('tasks').findOne(taskIdQuery(scope.query, taskId));
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const deps = task.dependencies || [];

    // Get blocking tasks (tasks this task depends on)
    const blockingTasks = deps.length > 0
      ? await db.collection('tasks').find({ ...scope.query, id: { $in: deps } }).toArray()
      : [];

    // Get dependent tasks (tasks that depend on this task)
    const dependentTasks = await db.collection('tasks')
      .find({ ...scope.query, dependencies: taskId })
      .toArray();

    // Calculate blocked status
    const isBlocked = blockingTasks.some(t => t.status !== 'done');
    const completedDeps = blockingTasks.filter(t => t.status === 'done').length;
    const totalDeps = blockingTasks.length;
    const progressPercent = totalDeps > 0 ? Math.round((completedDeps / totalDeps) * 100) : 100;

    res.json({
      blockingTasks: blockingTasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
      dependentTasks: dependentTasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
      isBlocked,
      progressPercent,
      completedDeps,
      totalDeps
    });
  } catch (err) {
    next(err);
  }
}
