import { FindOneSession } from './session.repository.interface';
import { Session, SessionProperties } from '../../../domain';
import {
  KNEX_PROVIDER,
  Repository,
  RepositoryMethodOptions,
} from '../../../../shared/database';
import { Knex } from 'knex';
import { Inject, Injectable } from 'moject';

@Injectable()
export class SessionRepository extends Repository {
  constructor(@Inject(KNEX_PROVIDER) private readonly knex: Knex) {
    super();
  }

  async findOne(
    query: FindOneSession,
    options?: RepositoryMethodOptions,
  ): Promise<Session | undefined> {
    const trx: Knex.Transaction | Knex =
      options?.transactionSession?.transaction || this.knex;
    const builder = trx
      .select(
        '*',
        trx
          .count('*')
          .from('book_page_refs')
          .where('book_page_refs.book_id', trx.ref('sessions.book_id'))
          .as('pages'),
      )
      .from('sessions');

    if (typeof query.id !== 'undefined') {
      builder.where('id', this.knex.raw('uuid_or_null(?)', [query.id]));
    }

    if (typeof query.bookId !== 'undefined') {
      builder.where(
        'book_id',
        this.knex.raw('uuid_or_null(?)', [query.bookId]),
      );
    }

    if (typeof query.userId !== 'undefined') {
      builder.where(
        'user_id',
        this.knex.raw('uuid_or_null(?)', [query.userId]),
      );
    }

    if (query.deleted === true) {
      builder.whereNotNull('deleted_at');
    } else if (query.deleted === false) {
      builder.whereNull('deleted_at');
    }

    if (typeof options?.transactionSession !== 'undefined') {
      builder.forUpdate();
    }

    const record = await builder.first();

    if (!record) {
      return;
    }

    const sessionProps: SessionProperties = {
      id: record.id,
      userId: record.user_id,
      telegramId: record.telegram_id,
      fileName: record.file_name,
      bookId: record.book_id,
      pages: record.pages,
      currentPage: record.current_page,
      finishedAt: record.finished_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at,
      createdAt: record.created_at,
    };

    // @ts-expect-error
    const session = new Session(sessionProps);

    return session;
  }

  async save(
    session: Session,
    options?: RepositoryMethodOptions,
  ): Promise<void> {
    const trx: Knex.Transaction | Knex =
      options?.transactionSession?.transaction || this.knex;

    await trx
      .insert({
        id: session.id,
        telegram_id: session.telegramId,
        file_name: session.fileName,
        user_id: session.userId,
        book_id: session.bookId,
        current_page: session.currentPage,
        finished_at: session.finishedAt,
        updated_at: session.updatedAt,
        deleted_at: session.deletedAt,
        created_at: session.createdAt,
      })
      .into('sessions')
      .onConflict('id')
      .merge()
      .where('sessions.id', session.id);

    super.save(session, options);
  }
}
