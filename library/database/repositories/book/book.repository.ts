import { FindOneBook } from './book.repository.interface';
import { Book, BookPage, BookProperties } from '../../../domain';
import {
  KNEX_PROVIDER,
  Repository,
  RepositoryMethodOptions,
} from '../../../../shared/database';
import { Knex } from 'knex';
import { Inject, Injectable } from 'moject';

@Injectable()
export class BookRepository extends Repository {
  constructor(@Inject(KNEX_PROVIDER) private readonly knex: Knex) {
    super();
  }

  async findOne(
    query: FindOneBook,
    options?: RepositoryMethodOptions,
  ): Promise<Book | undefined> {
    const trx: Knex.Transaction | Knex =
      options?.transactionSession?.transaction || this.knex;
    const builder = trx.select('*').from('books');

    if (typeof query.id !== 'undefined') {
      builder.where('id', this.knex.raw('uuid_or_null(?)', [query.id]));
    }

    if (typeof query.sourceId !== 'undefined') {
      builder.where(
        'source_id',
        this.knex.raw('uuid_or_null(?)', [query.sourceId]),
      );
    }

    if (typeof options?.transactionSession !== 'undefined') {
      builder.forUpdate();
    }

    const record = await builder.first();

    if (!record) {
      return;
    }

    const pages: BookPage[] = (
      await trx
        .select('page_id', 'number')
        .from('book_page_refs')
        .where('book_id', record.id)
        .orderBy('number', 'asc')
    ).map((item) => ({
      pageId: item.page_id,
    }));

    const bookProps: BookProperties = {
      id: record.id,
      language: record.language,
      sourceId: record.source_id,
      coverUrl: record.cover_url,
      title: record.title,
      description: record.description,
      annotation: record.annotation,
      author: record.author,
      publisher: record.publisher,
      pages: pages,
      date: record.date,
      doi: record.doi,
      isbn: record.isbn,
      uuid: record.uuid,
      jdcn: record.jdcn,
      createdAt: record.created_at,
    };

    // @ts-expect-error
    const book = new Book(bookProps);

    return book;
  }

  async save(book: Book, options?: RepositoryMethodOptions): Promise<void> {
    const trx: Knex.Transaction | Knex =
      options?.transactionSession?.transaction || this.knex;

    await trx
      .insert({
        id: book.id,
        source_id: book.sourceId,
        cover_url: book.coverUrl,
        title: book.title,
        description: book.description,
        annotation: book.annotation,
        language: book.language,
        author: book.author,
        publisher: book.publisher,
        date: book.date,
        doi: book.doi,
        isbn: book.isbn,
        uuid: book.uuid,
        jdcn: book.jdcn,
        created_at: book.createdAt,
      })
      .into('books')
      .onConflict('id')
      .merge()
      .where('books.id', book.id);

    const refs = book.pages.map((page, index) => ({
      book_id: book.id,
      page_id: page.pageId,
      number: index + 1,
    }));

    await trx.delete().from('book_page_refs').where('book_id', book.id);
    await trx.batchInsert('book_page_refs', refs, 100);

    super.save(book, options);
  }
}
