import { Inject, Injectable } from 'moject';
import { AuthContext } from '../../../identification/domain';
import { ContentItemDto, SessionDto, PageDto } from '../dto';
import { KNEX_PROVIDER } from '../../../shared/database';
import { Knex } from 'knex';
import { BookRepository, SessionRepository } from '../../database';
import { Session } from '../../domain';
import { randomUUID } from 'crypto';

export type SessionsQuery = {
  query?: string;
  isFinished?: boolean;
  limit: number;
  offset: number;
};

export type SessionQuery = {
  bookId?: string;
};

export type ContentsQuery = {
  sessionId: string;
  limit: number;
  offset: number;
};

@Injectable()
export class SessionService {
  constructor(
    @Inject(KNEX_PROVIDER)
    private readonly knex: Knex,
    @Inject(SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @Inject(BookRepository)
    private readonly bookRepository: BookRepository,
  ) {}

  async cloneSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<SessionDto | undefined> {
    const session = await this.sessionRepository.findOne({
      id: sessionId,
      deleted: false,
    });

    if (!session) {
      return;
    }

    const book = await this.bookRepository.findOne({
      id: session.bookId,
    });

    if (!book) {
      return;
    }

    let clonedSession = session;

    if (session.userId !== context.userId) {
      clonedSession = session.clone({
        id: randomUUID(),
        userId: context.userId,
        createdAt: new Date(),
        book,
      });

      await this.sessionRepository.save(clonedSession);
    }

    return {
      id: clonedSession.id,
      telegramId: clonedSession.telegramId,
      fileName: clonedSession.fileName,
      finishedAt: clonedSession.finishedAt,
      currentPage: clonedSession.currentPage,
      book: {
        id: book.id,
        coverUrl: book.coverUrl,
        title: book.title,
        author: book.author,
        description: book.description,
      },
    };
  }

  async findSessions(
    context: AuthContext,
    query: SessionsQuery,
  ): Promise<{ total: number; sessions: SessionDto[] }> {
    const queryBuilder = this.knex
      .select([
        'session.id',
        'session.telegram_id',
        'session.file_name',
        'session.finished_at',
        'session.current_page',
        'book.id as book_id',
        'book.title as book_title',
        'book.cover_url as book_cover_url',
        'book.author as book_author',
        'book.description as book_description',
      ])
      .from('sessions as session')
      .innerJoin('books as book', 'book.id', '=', 'session.book_id')
      .where('session.user_id', '=', context.userId)
      .whereNull('deleted_at');

    if (query.isFinished === true) {
      queryBuilder.whereNotNull('session.finished_at');
    } else if (query.isFinished === false) {
      queryBuilder.whereNull('session.finished_at');
    }

    const queryText = query.query?.replace('%', '').trim();

    if (queryText && queryText.length > 0) {
      queryBuilder.where((qb) =>
        qb
          .where('book.id', this.knex.raw('uuid_or_null(?)', queryText))
          .orWhere('book.title', 'ILIKE', queryText + '%'),
      );
    }

    const [{ total }] = await queryBuilder
      .clone()
      .clearSelect()
      .count<{ total: number }[]>({ total: '*' });

    const records = await queryBuilder
      .orderBy('session.created_at', 'desc')
      .limit(query.limit)
      .offset(query.offset);
    const sessions: SessionDto[] = [];

    for (const record of records) {
      sessions.push({
        id: record.id,
        telegramId: record.telegram_id,
        fileName: record.file_name,
        finishedAt: record.finishedAt,
        currentPage: record.current_page,
        book: {
          id: record.book_id,
          coverUrl: record.book_cover_url,
          title: record.book_title,
          author: record.book_author,
          description: record.book_description,
        },
      });
    }

    return {
      total,
      sessions,
    };
  }

  async findSession(
    context: AuthContext,
    query: SessionQuery,
  ): Promise<SessionDto | undefined> {
    const queryBuilder = this.knex
      .select([
        'session.id',
        'session.telegram_id',
        'session.file_name',
        'session.finished_at',
        'session.current_page',
        'book.id as book_id',
        'book.title as book_title',
        'book.cover_url as book_cover_url',
        'book.author as book_author',
        'book.description as book_description',
      ])
      .from('sessions as session')
      .innerJoin('books as book', 'book.id', '=', 'session.book_id')
      .where('session.user_id', '=', context.userId)
      .whereNull('deleted_at');

    if (query.bookId) {
      queryBuilder.whereRaw('session.book_id = uuid_or_null(?)', [
        query.bookId,
      ]);
    }

    const record = await queryBuilder.first();

    if (!record) {
      return;
    }

    return {
      id: record.id,
      telegramId: record.telegram_id,
      fileName: record.file_name,
      finishedAt: record.finishedAt,
      currentPage: record.current_page,
      book: {
        id: record.book_id,
        coverUrl: record.book_cover_url,
        title: record.book_title,
        author: record.book_author,
        description: record.book_description,
      },
    };
  }

  async getSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<SessionDto | undefined> {
    const record = await this.knex
      .select([
        'session.id',
        'session.telegram_id',
        'session.file_name',
        'session.finished_at',
        'session.current_page',
        'book.id as book_id',
        'book.cover_url as book_cover_url',
        'book.title as book_title',
        'book.author as book_author',
        'book.description as book_description',
      ])
      .from('sessions as session')
      .innerJoin('books as book', 'book.id', '=', 'session.book_id')
      .where('session.id', '=', this.knex.raw('uuid_or_null(?)', [sessionId]))
      .where('session.user_id', '=', context.userId)
      .whereNull('session.deleted_at')
      .first();

    if (!record) {
      return;
    }

    return {
      id: record.id,
      telegramId: record.telegram_id,
      fileName: record.file_name,
      finishedAt: record.finished_at,
      currentPage: record.current_page,
      book: {
        id: record.book_id,
        coverUrl: record.book_cover_url,
        title: record.book_title,
        author: record.book_author,
        description: record.book_description,
      },
    };
  }

  async getSessionTelegramId(sessionId: string): Promise<string | undefined> {
    const record = await this.knex
      .select(['session.telegram_id'])
      .from('sessions as session')
      .where('session.id', '=', this.knex.raw('uuid_or_null(?)', [sessionId]))
      .whereNull('session.deleted_at')
      .first();

    return record?.telegram_id;
  }

  async getContents(
    context: AuthContext,
    query: ContentsQuery,
  ): Promise<{ total: number; items: ContentItemDto[] }> {
    const session = await this.sessionRepository.findOne({
      id: query.sessionId,
      userId: context.userId,
      deleted: false,
    });

    if (!session) {
      return {
        total: 0,
        items: [],
      };
    }

    const queryBuilder = this.knex
      .select('page.id', 'page.titles', 'ref.number')
      .from('book_page_refs as ref')
      .innerJoin('pages as page', 'page.id', 'ref.page_id')
      .whereNotNull('page.titles')
      .where('ref.book_id', '=', session.bookId);

    const [{ total }] = await queryBuilder
      .clone()
      .clearSelect()
      .select(this.knex.raw('COUNT(*) as total'));

    const records = await queryBuilder
      .orderBy('ref.number', 'asc')
      .limit(query.limit)
      .offset(query.offset);
    const items: ContentItemDto[] = [];

    for (const record of records) {
      items.push({
        id: record.id,
        titles: record.titles,
        pageNumber: record.number,
      });
    }

    return {
      total,
      items,
    };
  }

  async openPage(
    context: AuthContext,
    sessionId: string,
    pageNumber: number,
  ): Promise<PageDto | undefined> {
    const session = await this.sessionRepository.findOne({
      id: sessionId,
      userId: context.userId,
      deleted: false,
    });

    if (!session) {
      return;
    }

    const isCurrentPageSet = session.setCurrentPage(pageNumber);

    if (!isCurrentPageSet) {
      return;
    }

    await this.sessionRepository.save(session);

    const record = await this.knex
      .select(['page.titles', 'ref.number'])
      .from('pages as page')
      .innerJoin('book_page_refs as ref', 'ref.page_id', '=', 'page.id')
      .where('ref.number', '=', pageNumber)
      .where('ref.book_id', '=', session.bookId)
      .first();

    if (!record) {
      return;
    }

    return {
      titles: record.titles,
      number: record.number,
      session: {
        id: session.id,
        finishedAt: session.finishedAt,
      },
      book: {
        id: session.bookId,
        pages: session.pages,
      },
    };
  }

  async finishSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      id: sessionId,
      userId: context.userId,
      deleted: false,
    });

    if (!session) {
      return false;
    }

    const isFinished = session.finish();

    if (!isFinished) {
      return false;
    }

    await this.sessionRepository.save(session);

    return true;
  }

  async restartSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      id: sessionId,
      userId: context.userId,
      deleted: false,
    });

    if (!session) {
      return false;
    }

    const isRestarted = session.restart();

    if (!isRestarted) {
      return false;
    }

    await this.sessionRepository.save(session);

    return true;
  }

  async deleteSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<boolean> {
    const session = await this.sessionRepository.findOne({
      id: sessionId,
      userId: context.userId,
      deleted: false,
    });

    if (!session) {
      return false;
    }

    const isDeleted = session.delete();

    if (!isDeleted) {
      return false;
    }

    await this.sessionRepository.save(session);

    return true;
  }
}
