import bcrypt from 'bcrypt';

export const seed = async function(knex) {
  await knex('tasks').del();
  await knex('projects').del();
  await knex('users').del();

  // 2. Insert Seed User
  const hashedPassword = await bcrypt.hash('password123', 12);
  const [user] = await knex('users').insert({
    name: 'Test User',
    email: 'test@example.com',
    password: hashedPassword
  }).returning('*');

  // 3. Insert Seed Project
  const [project] = await knex('projects').insert({
    name: 'Zomato Greening India',
    description: 'Initial project for task tracking',
    owner_id: user.id
  }).returning('*');

  // 4. Insert 3 Tasks
  await knex('tasks').insert([
    { 
      title: 'Setup Database', 
      status: 'done', 
      priority: 'high', 
      project_id: project.id, 
      assignee_id: user.id,
      created_by: user.id,
    },
    { 
      title: 'Implement Auth', 
      status: 'in_progress', 
      priority: 'medium', 
      project_id: project.id, 
      assignee_id: user.id,
      created_by: user.id,
    },
    { 
      title: 'Write Unit Tests', 
      status: 'todo', 
      priority: 'low', 
      project_id: project.id, 
      assignee_id: null,
      created_by: user.id,
    }
  ]);
};
