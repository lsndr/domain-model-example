import { BookCreatedEvent } from '../events';
import { Aggregate } from '../../../shared/domain';
import { BookPage, BookProperties } from './book.types';

export class Book extends Aggregate {
  readonly sourceId: string;
  title: string | null;
  coverUrl: string | null;
  description: string | null;
  annotation: string | null;
  language: string | null;
  author: string | null;
  publisher: string | null;
  date: string | null;
  doi: string | null;
  isbn: string | null;
  uuid: string | null;
  jdcn: string | null;
  #pages: BookPage[];
  readonly createdAt: Date;

  get pages(): ReadonlyArray<BookPage> {
    return this.#pages;
  }

  private constructor(props: BookProperties) {
    super(props);

    this.sourceId = props.sourceId;
    this.coverUrl = props.coverUrl;
    this.title = props.title;
    this.description = props.description;
    this.annotation = props.annotation;
    this.author = props.author;
    this.language = props.language;
    this.publisher = props.publisher;
    this.date = props.date;
    this.doi = props.doi;
    this.isbn = props.isbn;
    this.uuid = props.uuid;
    this.jdcn = props.jdcn;
    this.#pages = props.pages;
    this.createdAt = props.createdAt;
  }

  static create(
    props: Pick<BookProperties, 'id' | 'pages' | 'sourceId' | 'createdAt'>,
  ) {
    if (props.pages.length == 0) {
      throw new Error("Can't create an empty book");
    }

    const book = new this({
      id: props.id,
      coverUrl: null,
      sourceId: props.sourceId,
      language: null,
      title: null,
      description: null,
      annotation: null,
      author: null,
      publisher: null,
      date: null,
      doi: null,
      isbn: null,
      uuid: null,
      jdcn: null,
      pages: props.pages,
      createdAt: props.createdAt,
    });

    book.events.push(
      new BookCreatedEvent({
        bookId: book.id,
        pages: book.pages,
      }),
    );

    return book;
  }
}
