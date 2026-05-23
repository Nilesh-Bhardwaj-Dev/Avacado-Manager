/**
 * @file seeder.js
 * @description Database initialization and seeding.
 * Seeds default teams, super admin, admin user, workspace members, tasks, and activities
 * on first run. Skips seeding if data already exists (idempotent).
 * Runs schema migrations on every startup to heal existing records.
 */
import { hashPassword } from '../services/password.service.js';

/** Returns a date string offset by `days` from today (YYYY-MM-DD) */
const relativeDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

/**
 * Seeds the database with default data.
 * @param {import('mongodb').Db} db - The MongoDB database instance.
 */
export async function seedDatabase(db) {
  // ── Teams ──────────────────────────────────────────────────────────────────
  const teamCount = await db.collection('teams').countDocuments();
  if (teamCount === 0) {
    await db.collection('teams').insertMany([
      { name: 'Frontend Engineering', ownerId: 'user-siddharth' },
      { name: 'Backend Engineering', ownerId: 'user-siddharth' },
      { name: 'Product Management', ownerId: 'user-siddharth' },
      { name: 'QA Testing', ownerId: 'user-siddharth' },
      { name: 'UI/UX Design', ownerId: 'user-siddharth' },
    ]);
    console.log('[Seeder] Default teams created.');
  }

  // ── Super Admin ────────────────────────────────────────────────────────────
  const superAdminExists = await db.collection('users').findOne({ accountRole: 'superadmin' });
  if (!superAdminExists) {
    await db.collection('users').insertOne({
      id: 'user-superadmin',
      email: 'admin@system.local',
      username: 'admin',
      password: await hashPassword('Admin123!'),
      name: 'System Administrator',
      role: 'Super Administrator',
      team: null,
      accountRole: 'superadmin',
      status: 'active',
      maxUsers: null,
      managedBy: null,
      avatar: 'SA',
      bio: 'System super administrator account.',
    });
    console.log('[Seeder] Super Admin account created (admin / Admin123!).');
  }

  // ── Users & Members ────────────────────────────────────────────────────────
  const userCount = await db.collection('users').countDocuments({ id: { $ne: 'user-superadmin' } });
  if (userCount === 0) {
    // Admin / login account
    await db.collection('users').insertOne({
      id: 'user-siddharth',
      email: 'siddharth@pulse.io',
      username: 'siddharth',
      password: await hashPassword('Password123!'),
      name: 'Siddharth Chauhan',
      role: 'Product Manager',
      team: 'Product Management',
      accountRole: 'admin',
      status: 'active',
      maxUsers: 25,
      managedBy: null,
      avatar: 'SC',
      bio: '',
    });

    // Workspace directory members
    await db.collection('users').insertMany([
      { id: 'member-1', name: 'Alex Carter',    email: 'alex.c@pulse.io',   username: 'alex.c',   team: 'UI/UX Design',         role: 'Lead Designer',             password: null, accountRole: 'user', status: 'active', managedBy: 'user-siddharth', avatar: 'AC', bio: '' },
      { id: 'member-2', name: 'Elena Rostova',  email: 'elena.r@pulse.io',  username: 'elena.r',  team: 'Frontend Engineering', role: 'Senior Dev',                password: null, accountRole: 'user', status: 'active', managedBy: 'user-siddharth', avatar: 'ER', bio: '' },
      { id: 'member-3', name: 'David Kojo',     email: 'david.k@pulse.io',  username: 'david.k',  team: 'Backend Engineering',  role: 'Backend Architect',         password: null, accountRole: 'user', status: 'active', managedBy: 'user-siddharth', avatar: 'DK', bio: '' },
      { id: 'member-4', name: 'Hana Takahashi', email: 'hana.t@pulse.io',   username: 'hana.t',   team: 'QA Testing',           role: 'QA Lead',                   password: null, accountRole: 'user', status: 'active', managedBy: 'user-siddharth', avatar: 'HT', bio: '' },
      { id: 'member-5', name: 'Marcus Aurelius',email: 'marcus.a@pulse.io', username: 'marcus.a', team: 'Product Management',   role: 'Growth Specialist',         password: null, accountRole: 'user', status: 'active', managedBy: 'user-siddharth', avatar: 'MA', bio: '' },
      { id: 'member-6', name: 'Emily Watson',   email: 'emily.w@pulse.io',  username: 'emily.w',  team: 'Frontend Engineering', role: 'Junior Frontend Developer', password: null, accountRole: 'user', status: 'active', managedBy: 'user-siddharth', avatar: 'EW', bio: '' },
    ]);
    console.log('[Seeder] Default users and members created.');

    // ── Tasks ────────────────────────────────────────────────────────────────
    await db.collection('tasks').insertMany([
      {
        id: 'task-1',
        title: 'Design Landing Page Mockups',
        description: 'Create high-fidelity interactive mockups for the new product landing page. Focus on glassmorphism elements, dark mode layouts, and typography guidelines.',
        team: 'UI/UX Design',
        assigneeId: 'member-1',
        priority: 'high',
        status: 'todo',
        dueDate: relativeDate(2),
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        tags: ['UI', 'Figma', 'v2-spec'],
        subtasks: [
          { id: 'sub-1-1', title: 'Conduct brainstorming workshop', done: true },
          { id: 'sub-1-2', title: 'Design mobile wireframes', done: false },
          { id: 'sub-1-3', title: 'Create desktop mockups in Figma', done: false },
        ],
        comments: [
          { id: 'c-1-1', author: 'Siddharth Chauhan', content: "Let's align this design style with the new branding guidelines.", timestamp: '2 hours ago' },
        ],
        ownerId: 'user-siddharth',
        dependencies: [],
      },
      {
        id: 'task-2',
        title: 'Set up OAuth2 Middleware Router',
        description: 'Implement secure authentication gateway using OAuth2 protocols. Integrate Google and GitHub login providers into the microservice infrastructure.',
        team: 'Backend Engineering',
        assigneeId: 'member-3',
        priority: 'high',
        status: 'progress',
        dueDate: relativeDate(5),
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        tags: ['Auth', 'Node.js', 'Security'],
        subtasks: [
          { id: 'sub-2-1', title: 'Create Auth routes configurations', done: true },
          { id: 'sub-2-2', title: 'Setup session serialization and token cookies', done: true },
          { id: 'sub-2-3', title: 'Write unit tests for Router middleware', done: false },
        ],
        comments: [
          { id: 'c-2-1', author: 'David Kojo', content: 'Make sure token validation handles session expiry gracefully.', timestamp: '1 day ago' },
        ],
        ownerId: 'user-siddharth',
        dependencies: [],
      },
      {
        id: 'task-3',
        title: 'Optimize Webpack Asset Bundle Size',
        description: 'Analyze dynamic imports in JS modules. Implement route-level code splitting and tree-shaking to reduce load bundle size below 250 KB.',
        team: 'Frontend Engineering',
        assigneeId: 'member-2',
        priority: 'medium',
        status: 'review',
        dueDate: relativeDate(-1),
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        tags: ['Webpack', 'Perf', 'JS'],
        subtasks: [
          { id: 'sub-3-1', title: 'Analyze bundle maps', done: true },
          { id: 'sub-3-2', title: 'Implement code splitting for dashboard modules', done: true },
        ],
        comments: [
          { id: 'c-3-1', author: 'Elena Rostova', content: 'Webpage load speed went up by 35% after modular splits!', timestamp: '4 hours ago' },
        ],
        ownerId: 'user-siddharth',
        dependencies: [],
      },
      {
        id: 'task-4',
        title: 'Conduct End-to-End Core Flow Tests',
        description: 'Write automated Cypress integration tests targeting registration, cart checkouts, and Stripe payment triggers.',
        team: 'QA Testing',
        assigneeId: 'member-4',
        priority: 'medium',
        status: 'todo',
        dueDate: relativeDate(10),
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
        tags: ['Cypress', 'E2E', 'Stripe'],
        subtasks: [],
        comments: [],
        ownerId: 'user-siddharth',
        dependencies: [],
      },
      {
        id: 'task-5',
        title: 'Launch Social Media Campaign Spec',
        description: 'Draft structural marketing copy and content schedules for LinkedIn and Twitter launch campaigns. Design corresponding graphic templates.',
        team: 'Product Management',
        assigneeId: 'member-5',
        priority: 'low',
        status: 'done',
        dueDate: relativeDate(-3),
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        tags: ['Marketing', 'Copy', 'Launch'],
        subtasks: [],
        comments: [],
        ownerId: 'user-siddharth',
        dependencies: [],
      },
    ]);
    console.log('[Seeder] Default tasks created.');

    // ── Activities ────────────────────────────────────────────────────────────
    await db.collection('activities').insertMany([
      { id: 'act-1', text: "Siddharth Chauhan created task 'Design Landing Page Mockups'", timestamp: '2 hours ago', createdAt: new Date(Date.now() - 2 * 3600 * 1000), ownerId: 'user-siddharth' },
      { id: 'act-2', text: "Elena Rostova moved 'Optimize Webpack Asset Bundle Size' to In Review", timestamp: '4 hours ago', createdAt: new Date(Date.now() - 4 * 3600 * 1000), ownerId: 'user-siddharth' },
      { id: 'act-3', text: "David Kojo commented on 'Set up OAuth2 Middleware Router'", timestamp: '1 day ago', createdAt: new Date(Date.now() - 24 * 3600 * 1000), ownerId: 'user-siddharth' },
      { id: 'act-4', text: "Marcus Aurelius completed task 'Launch Social Media Campaign Spec'", timestamp: '3 days ago', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000), ownerId: 'user-siddharth' },
    ]);
    console.log('[Seeder] Default activities created.');
    console.log('[Seeder] ✅ Database seeded successfully.');
  } else {
    console.log('[Seeder] Database already seeded. Skipping.');
  }

  // ── Schema Migrations (Runs always to heal existing records) ───────────────

  // 1. Ensure all activities have a createdAt Date timestamp
  const unmigratedActivities = await db.collection('activities').find({ createdAt: { $exists: false } }).toArray();
  if (unmigratedActivities.length > 0) {
    console.log(`[Seeder] Migrating ${unmigratedActivities.length} activities to include createdAt...`);
    for (const act of unmigratedActivities) {
      let date = new Date();
      if (act.id && act.id.startsWith('act-')) {
        const ts = parseInt(act.id.replace('act-', ''), 10);
        if (!isNaN(ts) && ts > 1000000000000) {
          date = new Date(ts);
        } else {
          const offsetMap = {
            'act-1': 2 * 3600 * 1000,
            'act-2': 4 * 3600 * 1000,
            'act-3': 24 * 3600 * 1000,
            'act-4': 3 * 24 * 3600 * 1000,
          };
          const offset = offsetMap[act.id] || 0;
          date = new Date(Date.now() - offset);
        }
      }
      await db.collection('activities').updateOne({ _id: act._id }, { $set: { createdAt: date } });
    }
    console.log('[Seeder] Activities migration complete.');
  }

  // 2. Ensure admin user has bio field
  await db.collection('users').updateOne(
    { id: 'user-siddharth', bio: { $exists: false } },
    { $set: { bio: '' } }
  );

  // 3. Ensure all tasks have a createdAt Date timestamp
  const unmigratedTasks = await db.collection('tasks').find({ createdAt: { $exists: false } }).toArray();
  if (unmigratedTasks.length > 0) {
    console.log(`[Seeder] Migrating ${unmigratedTasks.length} tasks to include createdAt...`);
    for (const t of unmigratedTasks) {
      let date = new Date();
      if (t.id && t.id.startsWith('task-')) {
        const ts = parseInt(t.id.replace('task-', ''), 10);
        if (!isNaN(ts) && ts > 1000000000000) {
          date = new Date(ts);
        } else {
          const offsetMap = {
            'task-1': 2 * 24 * 3600 * 1000,
            'task-2': 5 * 24 * 3600 * 1000,
            'task-3': 1 * 24 * 3600 * 1000,
            'task-4': 10 * 24 * 3600 * 1000,
            'task-5': 3 * 24 * 3600 * 1000,
          };
          const offset = offsetMap[t.id] || 0;
          date = new Date(Date.now() - offset);
        }
      }
      await db.collection('tasks').updateOne({ _id: t._id }, { $set: { createdAt: date } });
    }
    console.log('[Seeder] Tasks migration complete.');
  }

  // 4. Ensure all users have accountRole, status, username fields (RBAC migration)
  const unmigratedUsers = await db.collection('users').find({ accountRole: { $exists: false } }).toArray();
  if (unmigratedUsers.length > 0) {
    console.log(`[Seeder] Migrating ${unmigratedUsers.length} users to include RBAC fields...`);
    for (const u of unmigratedUsers) {
      const update = {};

      // Determine accountRole
      if (u.password === null) {
        update.accountRole = 'user';
        update.managedBy = 'user-siddharth';
      } else {
        update.accountRole = 'admin';
        update.managedBy = null;
        update.maxUsers = 25;
      }

      update.status = 'active';
      update.username = u.username || (u.email ? u.email.split('@')[0] : u.id);

      await db.collection('users').updateOne({ _id: u._id }, { $set: update });
    }
    console.log('[Seeder] RBAC migration complete.');
  }

  // 5. Ensure all tasks, teams, and activities have an ownerId field (Workspace isolation migration)
  await db.collection('tasks').updateMany(
    { ownerId: { $exists: false } },
    { $set: { ownerId: 'user-siddharth' } }
  );

  await db.collection('teams').updateMany(
    { ownerId: { $exists: false } },
    { $set: { ownerId: 'user-siddharth' } }
  );

  await db.collection('activities').updateMany(
    { ownerId: { $exists: false } },
    { $set: { ownerId: 'user-siddharth' } }
  );
  console.log('[Seeder] Workspace isolation migration complete.');

  // 6. Ensure all tasks have a dependencies array
  const tasksWithoutDeps = await db.collection('tasks').updateMany(
    { dependencies: { $exists: false } },
    { $set: { dependencies: [] } }
  );
  if (tasksWithoutDeps.modifiedCount > 0) {
    console.log(`[Seeder] ✅ Migration: Added dependencies field to ${tasksWithoutDeps.modifiedCount} tasks`);
  }

  // 7. Create notifications collection index
  try {
    await db.collection('notifications').createIndex({ recipientId: 1, createdAt: -1 });
  } catch {
    // Index may already exist
  }
}
