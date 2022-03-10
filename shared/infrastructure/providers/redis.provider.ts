import { Provider } from 'moject';
import { redisFactory, REDIS_PROVIDER } from '../redis';

export const redisProvider: Provider = {
  identifier: REDIS_PROVIDER,
  useFactory: redisFactory,
};
