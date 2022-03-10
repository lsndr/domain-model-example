import { createClient } from 'redis';

export const REDIS_PROVIDER = Symbol.for('REDIS_PROVIDER');

export const redisFactory = async () => {
  if (typeof process.env.REDIS_URL === 'undefined') {
    throw new Error('REDIS_URL is required');
  }

  const client = createClient({
    url: process.env.REDIS_URL,
  });

  await client.connect();

  return client;
};

export type RedisClient = Awaited<ReturnType<typeof redisFactory>>;
