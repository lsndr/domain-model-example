import { knex, Knex } from 'knex';
import * as pg from 'pg';

export const KNEX_PROVIDER = Symbol.for('KNEX_PROVIDER');

export const knexFactory = (): Knex => {
  if (typeof process.env.DB_URL === 'undefined') {
    throw new Error('DB_URL is required');
  }

  // We don't expect to hit bigint numbers
  pg.types.setTypeParser(20, parseInt);

  return knex({
    client: 'pg',
    connection: process.env.DB_URL,
    pool: {
      min: 5,
      max: 20,
    },
  });
};
