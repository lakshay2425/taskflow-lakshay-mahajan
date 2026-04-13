export const up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  return knex.schema
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.string('email').unique().notNullable().index();
      table.string('password').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('projects', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.text('description');
      table.uuid('owner_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('tasks', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('title').notNullable();
      table.text('description');
      table.enum('status', ['todo', 'in_progress', 'done']).defaultTo('todo');
      table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
      table.uuid('project_id')
        .references('id')
        .inTable('projects')
        .onDelete('CASCADE')
        .notNullable();
      table.uuid('assignee_id')
        .references('id')
        .inTable('users')
        .onDelete('SET NULL');
      table.uuid('created_by')         
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .notNullable();
      table.date('due_date');
      table.timestamps(true, true);
    });
};

export const down = function(knex) {
  return knex.schema
    .dropTableIfExists('tasks')
    .dropTableIfExists('projects')
    .dropTableIfExists('users');
};
