import { Knex } from 'knex';
import { KNEX_PROVIDER } from '../knex';
import { Inject, Injectable } from 'moject';
import { TransactionSession } from './unit-of-work.interface';
import {
  EVENT_DISPATCHER_PROVIDER,
  IEventDispatcher,
} from '../../infrastructure';

@Injectable()
export class UnitOfWork {
  constructor(
    @Inject(KNEX_PROVIDER)
    private readonly knex: Knex,
    @Inject(EVENT_DISPATCHER_PROVIDER)
    private readonly eventDispatcher: IEventDispatcher,
  ) {}

  async transaction<T>(
    fn: (session: TransactionSession) => Promise<T>,
  ): Promise<T> {
    const transaction = await this.knex.transaction(null, {
      isolationLevel: 'read committed',
    });

    const session = {
      transaction,
      events: [],
    };

    try {
      const result = await fn(session);
      await transaction.commit();
      await this.eventDispatcher.dispatch(session.events);

      return result;
    } catch (e) {
      await transaction.rollback();

      throw e;
    }
  }
}
