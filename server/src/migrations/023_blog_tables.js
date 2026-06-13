exports.up = async (knex) => {
  await knex.schema.createTable('blog_categories', (t) => {
    t.increments('id');
    t.string('name', 80).notNullable();
    t.string('slug', 80).notNullable().unique();
    t.string('color', 20).defaultTo('#D4AF37');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('blog_posts', (t) => {
    t.increments('id');
    t.string('title', 200).notNullable();
    t.string('slug', 200).notNullable().unique();
    t.text('excerpt').nullable();
    t.text('content').nullable();           // HTML body
    t.string('cover_image', 500).nullable();
    t.integer('category_id').unsigned().nullable().references('id').inTable('blog_categories').onDelete('SET NULL');
    t.enum('status', ['draft', 'published']).defaultTo('draft');
    t.string('author', 100).defaultTo('Jyotish Stack');
    t.string('seo_title', 200).nullable();
    t.text('seo_description').nullable();
    t.string('tags', 500).nullable();       // comma-separated
    t.integer('view_count').defaultTo(0);
    t.timestamp('published_at').nullable();
    t.timestamps(true, true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('blog_posts');
  await knex.schema.dropTableIfExists('blog_categories');
};
