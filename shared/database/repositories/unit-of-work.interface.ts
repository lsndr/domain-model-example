import { Knex } from 'knex';
import { IEvent } from '../../domain';

export interface TransactionSession {
  readonly transaction: Knex.Transaction;
  readonly events: IEvent<object>[];
}
