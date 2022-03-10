import { knexFactory, KNEX_PROVIDER } from '../knex';
import { Provider } from 'moject';

export const knexProvider: Provider = {
  identifier: KNEX_PROVIDER,
  useFactory: knexFactory,
};
