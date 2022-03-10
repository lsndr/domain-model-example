import {
  BookRepository,
  PageRepository,
  SessionRepository,
} from './repositories';
import { Module } from 'moject';
import { SharedDatabaseModule } from '../../shared/database';

@Module({
  imports: [SharedDatabaseModule],
  providers: [BookRepository, PageRepository, SessionRepository],
  exports: [
    BookRepository,
    PageRepository,
    SessionRepository,
    SharedDatabaseModule,
  ],
})
export class LibraryDatabaseModule {}
