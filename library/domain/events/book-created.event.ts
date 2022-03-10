import { BookPage } from '../models/book.types';

export class BookCreatedEvent {
  static channel = 'library.book';

  bookId: string;
  pages: ReadonlyArray<BookPage>;

  constructor(props: BookCreatedEvent) {
    this.bookId = props.bookId;
    this.pages = props.pages;
  }
}
