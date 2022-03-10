import { BookUploaderService, SessionService } from './services';
import { Module } from 'moject';
import { SharedInfrastrutureModule } from '../../shared/infrastructure';
import { LibraryDatabaseModule } from '../database';
import { BookService } from './services/book.service';

@Module({
  imports: [LibraryDatabaseModule, SharedInfrastrutureModule],
  providers: [BookUploaderService, SessionService, BookService],
  exports: [BookUploaderService, SessionService, BookService],
})
export class LibraryApplicationModule {}
