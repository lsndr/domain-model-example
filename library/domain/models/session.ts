import { Book } from './book';
import { Aggregate, AggregateProperties } from '../../../shared/domain';

export interface SessionProperties extends AggregateProperties {
  userId: string;
  bookId: string;
  telegramId: string | null;
  fileName: string | null;
  pages: number;
  currentPage: number;
  finishedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  deletedAt: Date | null;
}

export class Session extends Aggregate {
  readonly userId: string;
  readonly telegramId: string | null;
  readonly fileName: string | null;
  readonly bookId: string;
  readonly pages: number;
  #currentPage: number;
  #finishedAt: Date | null;
  #updatedAt: Date;
  #deletedAt: Date | null;
  readonly createdAt: Date;

  get currentPage() {
    return this.#currentPage;
  }

  get finishedAt() {
    return this.#finishedAt;
  }

  get updatedAt() {
    return this.#updatedAt;
  }

  get deletedAt() {
    return this.#deletedAt;
  }

  private constructor(props: SessionProperties) {
    super(props);

    this.userId = props.userId;
    this.bookId = props.bookId;
    this.telegramId = props.telegramId;
    this.fileName = props.fileName;
    this.pages = props.pages;
    this.#currentPage = props.currentPage;
    this.#finishedAt = props.finishedAt;
    this.#updatedAt = props.updatedAt;
    this.#deletedAt = props.deletedAt;
    this.createdAt = props.createdAt;
  }

  static create(
    props: Pick<
      SessionProperties,
      'id' | 'telegramId' | 'fileName' | 'userId' | 'createdAt'
    > & {
      book: Book;
    },
  ) {
    const session = new this({
      id: props.id,
      userId: props.userId,
      bookId: props.book.id,
      telegramId: props.telegramId,
      fileName: props.fileName,
      pages: props.book.pages.length,
      currentPage: 1,
      finishedAt: null,
      updatedAt: props.createdAt,
      deletedAt: null,
      createdAt: props.createdAt,
    });

    return session;
  }

  clone(props: { id: string, book: Book, createdAt: Date, userId: string }) {
    return Session.create({
      id: props.id,
      telegramId: this.telegramId,
      fileName: this.fileName,
      userId: props.userId,
      createdAt: new Date(),
      book: props.book,
    });
  }

  setCurrentPage(pageNumber: number): boolean {
    if (pageNumber <= 0 || pageNumber > this.pages) {
      return false;
    }

    this.#currentPage = pageNumber;
    this.#updatedAt = new Date();

    return true;
  }

  finish(): boolean {
    if (this.#finishedAt) {
      return false;
    }

    this.#finishedAt = this.#finishedAt || new Date();
    this.#updatedAt = new Date();

    return true;
  }

  restart(): boolean {
    if (!this.#finishedAt) {
      return false;
    }

    this.#finishedAt = null;
    this.#updatedAt = new Date();

    return true;
  }

  delete(): boolean {
    if (this.#deletedAt) {
      return false;
    }

    this.#deletedAt = new Date();
    this.#updatedAt = new Date();

    return true;
  }
}
