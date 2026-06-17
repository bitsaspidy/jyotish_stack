'use strict';
// email_logs.status was an ENUM('queued','sent','failed'), so the retry flow's
// update({ status: 'retried' }) failed with "Data truncated for column 'status'"
// and the retry never sent. Convert to VARCHAR so 'retried'/'retrying' (and any
// future states) never require a schema change again — same rationale as 029.

exports.up = async (knex) => {
  await knex.raw("ALTER TABLE email_logs MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'queued'");
};

exports.down = async (knex) => {
  await knex.raw(
    "ALTER TABLE email_logs MODIFY COLUMN status " +
    "ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued'"
  );
};
