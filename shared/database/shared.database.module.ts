import { UnitOfWork } from './repositories';
import { Module } from 'moject';
import { knexProvider } from './providers';
import { SharedInfrastrutureModule } from '../infrastructure';

@Module({
  imports: [SharedInfrastrutureModule],
  providers: [knexProvider, UnitOfWork],
  exports: [knexProvider, UnitOfWork],
})
export class SharedDatabaseModule {}
