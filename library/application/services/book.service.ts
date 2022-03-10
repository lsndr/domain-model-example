import { Inject, Injectable } from 'moject';
import { BookPageDto, ContentItemDto, BookDto } from '../dto';
import { KNEX_PROVIDER } from '../../../shared/database';
import { Knex } from 'knex';

export type SessionsQuery = {
  isFinished: boolean;
  limit: number;
  offset: number;
};

export type BooksQuery = {
  query?: string;
  limit: number;
  offset: number;
};

@Injectable()
export class BookService {
  constructor(
    @Inject(KNEX_PROVIDER)
    private readonly knex: Knex,
  ) {}

  async getBook(bookId: string): Promise<BookDto | undefined> {
    const record = await this.knex
      .select(
        'book.id',
        'book.title',
        'book.description',
        'book.cover_url',
        'book.author',
      )
      .from('books as book')
      .where('book.id', '=', this.knex.raw('uuid_or_null(?)', [bookId]))
      .first();

    if (!record) {
      return;
    }

    return {
      id: record.id,
      title: record.title,
      description: record.description,
      coverUrl: record.cover_url,
      author: record.author,
    };
  }

  async getContents(bookId: string): Promise<ContentItemDto[]> {
    const records = await this.knex
      .select('page.id', 'page.titles', 'ref.number')
      .from('book_page_refs as ref')
      .innerJoin('pages as page', 'page.id', 'ref.page_id')
      .where('ref.book_id', '=', this.knex.raw('uuid_or_null(?)', [bookId]))
      .orderBy('ref.number', 'asc');

    const items: ContentItemDto[] = [];

    for (const record of records) {
      items.push({
        id: record.id,
        titles: record.titles,
        pageNumber: record.number,
      });
    }

    return items;
  }

  async getPage(
    bookId: string,
    pageNumber: number,
  ): Promise<BookPageDto | undefined> {
    const record = await this.knex
      .select([
        'book.id as book_id',
        'book.title as book_title',
        'book.cover_url as book_cover_url',
        'book.description as book_description',
        'book.author as book_author',
        'page.id',
        'page.titles',
        'page.content',
        'ref.number',
        this.knex.raw(
          '(SELECT COUNT(*) FROM book_page_refs as ref2 WHERE ref2.book_id = ref.book_id) as book_pages',
        ),
        'prev_ref.number as prev_page_number',
        'prev_page.titles as prev_page_titles',
        'next_ref.number as next_page_number',
        'next_page.titles as next_page_titles',
      ])
      .from('book_page_refs as ref')
      .innerJoin('pages as page', 'page.id', '=', 'ref.page_id')
      .innerJoin('books as book', 'book.id', '=', 'ref.book_id')
      .leftJoin('book_page_refs as prev_ref', (qb) =>
        qb
          .on(this.knex.raw('prev_ref.number = ?::bigint', [pageNumber - 1]))
          .andOn('prev_ref.book_id', '=', 'book.id'),
      )
      .leftJoin('pages as prev_page', 'prev_page.id', '=', 'prev_ref.page_id')
      .leftJoin('book_page_refs as next_ref', (qb) =>
        qb
          .on(this.knex.raw('next_ref.number = ?::bigint', [pageNumber + 1]))
          .andOn('next_ref.book_id', '=', 'book.id'),
      )
      .leftJoin('pages as next_page', 'next_page.id', '=', 'next_ref.page_id')
      .whereRaw('ref.number = ?::bigint', [pageNumber])
      .where('ref.book_id', this.knex.raw('uuid_or_null(?)', [bookId]))
      .first();

    if (!record) {
      return;
    }

    return {
      titles: record.titles,
      number: record.number,
      content: record.content,
      prev: record.prev_page_number && {
        number: record.prev_page_number,
        titles: record.prev_page_titles,
      },
      next: record.next_page_number && {
        number: record.next_page_number,
        titles: record.next_page_titles,
      },
      book: {
        id: record.book_id,
        coverUrl: record.book_cover_url,
        title: record.book_title,
        description: record.book_description,
        author: record.book_author,
        pages: record.book_pages,
      },
    };
  }
}
