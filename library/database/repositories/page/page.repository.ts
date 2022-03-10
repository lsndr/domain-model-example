import { FindOnePage } from './page.repository.interface';
import { Page, PageProperties } from '../../../domain';
import {
  KNEX_PROVIDER,
  Repository,
  RepositoryMethodOptions,
} from '../../../../shared/database';
import { Knex } from 'knex';
import { Inject, Injectable } from 'moject';

@Injectable()
export class PageRepository extends Repository {
  constructor(@Inject(KNEX_PROVIDER) private readonly knex: Knex) {
    super();
  }

  async findOne(
    query: FindOnePage,
    options?: RepositoryMethodOptions,
  ): Promise<Page | undefined> {
    const trx: Knex.Transaction | Knex =
      options?.transactionSession?.transaction || this.knex;
    const builder = trx.select().from('pages');

    if (typeof query.id !== 'undefined') {
      builder.where('id', this.knex.raw('uuid_or_null(?)', [query.id]));
    }

    if (typeof options?.transactionSession !== 'undefined') {
      builder.forUpdate();
    }

    const record = await builder.first();

    if (!record) {
      return;
    }

    const pageProps: PageProperties = {
      id: record.id,
      titles: record.titles,
      content: record.content,
    };

    // @ts-expect-error
    const page = new Page(pageProps);

    return page;
  }

  async save(page: Page, options?: RepositoryMethodOptions): Promise<void> {
    const trx: Knex.Transaction | Knex =
      options?.transactionSession?.transaction || this.knex;

    await trx
      .insert({
        id: page.id,
        titles: page.titles ? JSON.stringify(page.titles) : null,
        content: page.content,
      })
      .into('pages')
      .onConflict('id')
      .merge()
      .where('pages.id', page.id);

    super.save(page, options);
  }
}
