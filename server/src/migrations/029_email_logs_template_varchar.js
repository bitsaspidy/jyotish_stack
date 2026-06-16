'use strict';
// email_logs.template was an ENUM of the original 6 template names, so logging any new
// template (contact_ack, contact_notify, …) failed with "Data truncated". Convert it to a
// plain VARCHAR so new email templates never require a schema change again.

exports.up = async (knex) => {
  await knex.raw("ALTER TABLE email_logs MODIFY COLUMN template VARCHAR(50) NOT NULL");
};

exports.down = async (knex) => {
  await knex.raw(
    "ALTER TABLE email_logs MODIFY COLUMN template " +
    "ENUM('welcome','verify_email','reset_password','subscription_confirm','newsletter','custom') NOT NULL"
  );
};
