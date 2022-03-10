import { TransactionSession } from './unit-of-work.interface';

export type RepositoryMethodOptions = {
  readonly transactionSession?: TransactionSession;
};
