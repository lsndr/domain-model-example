import { AggregateProperties } from '../../../shared/domain';

export type BookPage = {
  pageId: string;
};

export interface BookProperties extends AggregateProperties {
  sourceId: string;
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
  pages: BookPage[];
  createdAt: Date;
}
