import { Module } from 'moject';
import { eventProviders, redisProvider, serviceProviders } from './providers';

@Module({
  providers: [...eventProviders, ...serviceProviders, redisProvider],
  exports: [...eventProviders, ...serviceProviders, redisProvider],
})
export class SharedInfrastrutureModule {}
