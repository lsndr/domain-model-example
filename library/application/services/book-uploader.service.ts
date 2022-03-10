import {
  EVENT_DISPATCHER_PROVIDER,
  EVENT_LISTENER_PROVIDER,
  IEventDispatcher,
  IEventListener,
} from '../../../shared/infrastructure';
import {
  Session,
  Book,
  Page,
  SourceAlreadyParsedEvent,
  SourceParsedEvent,
  SourceParsingFailedEvent,
  SourceReparsedEvent,
  SourceReparsingFailedEvent,
  RequestSourceParsingCommand,
  RequestSourceReparsingCommand,
  BookPage,
} from '../../domain';
import { BookRepository } from '../../database/repositories/book/book.repository';
import { UnitOfWork } from '../../../shared/database/repositories/unit-of-work';
import { PageRepository } from '../../database/repositories/page/page.repository';
import { Inject, Injectable } from 'moject';
import { randomUUID } from 'crypto';
import {
  SourceHasNoPagesException,
  SourceParsingFailedException,
  SourceParsingTimedoutException,
  SourceReparsingFailedException,
} from '../exceptions';
import { AuthContext } from '../../../identification/domain';
import { SessionRepository } from '../../database';
import { SessionDto } from '../dto';
import { Telegram } from 'telegraf';

export type UploadBookByUrlPayload = {
  fileUrl: string;
  fileName: string;

  telegramId?: string;
};

@Injectable()
export class BookUploaderService {
  private readonly telegram: Telegram;

  constructor(
    @Inject(EVENT_DISPATCHER_PROVIDER)
    private readonly eventDispatcher: IEventDispatcher,
    @Inject(EVENT_LISTENER_PROVIDER)
    private readonly eventListener: IEventListener,
    @Inject(BookRepository)
    private readonly bookRepository: BookRepository,
    @Inject(PageRepository)
    private readonly pageRepository: PageRepository,
    @Inject(SessionRepository)
    private readonly sessionRepository: SessionRepository,
    @Inject(UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {
    if (typeof process.env.BOT_TOKEN === 'undefined') {
      throw new Error('BOT_TOKEN is required');
    }

    this.telegram = new Telegram(process.env.BOT_TOKEN);
  }

  async uploadBookByUrl(
    context: AuthContext,
    payload: UploadBookByUrlPayload,
  ): Promise<SessionDto> {
    return new Promise((resolve, reject) => {
      const requestEvent = new RequestSourceParsingCommand({
        requestId: randomUUID(),
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
      });

      const onSourceParsed = async (
        event: SourceParsedEvent | SourceReparsedEvent,
      ) => {
        try {
          if (event.requestId !== requestEvent.requestId) {
            return;
          }

          await this.eventListener.unregister(
            SourceParsedEvent,
            onSourceParsed,
          );
          await this.eventListener.unregister(
            SourceParsingFailedEvent,
            onSourceParsingFailed,
          );
          await this.eventListener.unregister(
            SourceAlreadyParsedEvent,
            onSourceAlreadyParsed,
          );

          const session = await this.onSourceParseOrReparsed(context, event, {
            telegramId: payload.telegramId,
            fileName: payload.fileName,
          });
          resolve(session);
        } catch (e) {
          reject(e);
        }
      };

      const onSourceReparsed = async (
        event: SourceParsedEvent | SourceReparsedEvent,
      ) => {
        try {
          if (event.requestId !== requestEvent.requestId) {
            return;
          }

          await this.eventListener.unregister(
            SourceReparsedEvent,
            onSourceReparsed,
          );
          await this.eventListener.unregister(
            SourceReparsingFailedEvent,
            onSourceReparsingFailed,
          );

          const session = await this.onSourceParseOrReparsed(context, event, {
            telegramId: payload.telegramId,
            fileName: payload.fileName,
          });
          resolve(session);
        } catch (e) {
          reject(e);
        }
      };

      const onSourceParsingFailed = async (event: SourceParsingFailedEvent) => {
        if (event.requestId !== requestEvent.requestId) {
          return;
        }

        reject(new SourceParsingFailedException(event));
      };

      const onSourceReparsingFailed = async (
        event: SourceReparsingFailedEvent,
      ) => {
        if (event.requestId !== requestEvent.requestId) {
          return;
        }

        reject(new SourceReparsingFailedException(event));
      };

      const onSourceAlreadyParsed = async (event: SourceAlreadyParsedEvent) => {
        try {
          if (event.requestId !== requestEvent.requestId) {
            return;
          }

          await this.eventListener.unregister(
            SourceParsedEvent,
            onSourceParsed,
          );

          await this.eventListener.unregister(
            SourceParsingFailedEvent,
            onSourceParsingFailed,
          );

          await this.eventListener.unregister(
            SourceAlreadyParsedEvent,
            onSourceAlreadyParsed,
          );

          const book = await this.bookRepository.findOne({
            sourceId: event.sourceId,
          });

          if (!book) {
            await this.eventListener.register(
              SourceReparsedEvent,
              onSourceReparsed,
            );
            await this.eventListener.register(
              SourceReparsingFailedEvent,
              onSourceReparsingFailed,
            );

            await this.eventDispatcher.dispatch(
              new RequestSourceReparsingCommand({
                requestId: event.requestId,
                sourceId: event.sourceId,
                fileName: payload.fileName,
                fileUrl: payload.fileUrl,
              }),
            );
          } else {
            let session = await this.sessionRepository.findOne({
              bookId: book.id,
              userId: context.userId,
              deleted: false,
            });

            if (typeof session === 'undefined') {
              session = Session.create({
                id: randomUUID(),
                telegramId: payload.telegramId || null,
                fileName: payload.fileName,
                userId: context.userId,
                book,
                createdAt: new Date(),
              });

              await this.sessionRepository.save(session);
            }

            resolve({
              id: session.id,
              telegramId: session.telegramId,
              fileName: session.fileName,
              finishedAt: session.finishedAt,
              currentPage: session.currentPage,
              book: {
                id: book.id,
                coverUrl: book.coverUrl,
                title: book.title,
                author: book.author,
                description: book.description,
              },
            });
          }
        } catch (e) {
          reject(e);
        }
      };

      Promise.all([
        this.eventListener.register(SourceParsedEvent, onSourceParsed),
        this.eventListener.register(
          SourceParsingFailedEvent,
          onSourceParsingFailed,
        ),
        this.eventListener.register(
          SourceAlreadyParsedEvent,
          onSourceAlreadyParsed,
        ),
      ])
        .then(() => this.eventDispatcher.dispatch(requestEvent))
        .catch(reject);

      setTimeout(() => {
        this.eventListener
          .unregister(SourceParsedEvent, onSourceParsed)
          .catch(console.error);
        this.eventListener
          .unregister(SourceReparsedEvent, onSourceReparsed)
          .catch(console.error);
        this.eventListener
          .unregister(SourceParsingFailedEvent, onSourceParsingFailed)
          .catch(console.error);
        this.eventListener
          .unregister(SourceReparsingFailedEvent, onSourceReparsingFailed)
          .catch(console.error);
        this.eventListener
          .unregister(SourceAlreadyParsedEvent, onSourceAlreadyParsed)
          .catch(console.error);

        reject(new SourceParsingTimedoutException());
      }, 5 * 60 * 1000);
    });
  }

  private async onSourceParseOrReparsed(
    context: AuthContext,
    event: SourceParsedEvent | SourceReparsedEvent,
    { telegramId, fileName }: { telegramId?: string; fileName: string },
  ): Promise<SessionDto> {
    if (event.pages.length === 0) {
      throw new SourceHasNoPagesException(event.sourceId);
    }

    const pages: BookPage[] = [];

    return this.uow.transaction<SessionDto>(async (transactionSession) => {
      for (let i = 0; i < event.pages.length; i++) {
        const page = Page.create({
          id: randomUUID(),
          content: event.pages[i].content,
        });

        page.titles = event.pages[i].titles || null;
        pages.push({
          pageId: page.id,
        });

        await this.pageRepository.save(page, { transactionSession });
      }

      const book = Book.create({
        id: randomUUID(),
        sourceId: event.sourceId,
        pages,
        createdAt: new Date(),
      });

      book.title = event.meta.title || null;
      book.coverUrl = event.meta.coverPath || null;
      book.description = event.meta.description || null;
      book.annotation = event.meta.annotation || null;
      book.author = event.meta.creator || null;
      book.language = event.meta.language || null;
      book.publisher = event.meta.publisher || null;
      book.date = event.meta.date || null;
      book.doi = event.meta.doi || null;
      book.isbn = event.meta.isbn || null;
      book.uuid = event.meta.uuid || null;
      book.jdcn = event.meta.jdcn || null;

      await this.bookRepository.save(book, { transactionSession });

      const session = Session.create({
        id: randomUUID(),
        telegramId: telegramId || null,
        fileName,
        userId: context.userId,
        book,
        createdAt: new Date(),
      });

      await this.sessionRepository.save(session);

      return {
        id: session.id,
        telegramId: session.telegramId,
        fileName: session.fileName,
        finishedAt: session.finishedAt,
        currentPage: session.currentPage,
        book: {
          id: book.id,
          coverUrl: book.coverUrl,
          title: book.title,
          author: book.author,
          description: book.description,
        },
      };
    });
  }
}
