import { RepositoryMethodOptions } from './repository.interface';
import { Aggregate } from '../../domain';

export abstract class Repository {
  save(aggregate: Aggregate, options?: RepositoryMethodOptions) {
    if (typeof options?.transactionSession?.events !== 'undefined') {
      options.transactionSession.events.push(...aggregate.events);
      aggregate.events.length = 0;
    }
  }
}
