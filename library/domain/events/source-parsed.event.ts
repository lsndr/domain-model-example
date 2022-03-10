export interface SourceMeta {
  title?: string;
  coverPath?: string;
  annotation?: string;
  description?: string;
  publisher?: string;
  date?: string;
  creator?: string;
  language?: string;
  doi?: string;
  isbn?: string;
  uuid?: string;
  jdcn?: string;
}

export interface SourcePage {
  titles?: string[];
  content: string;
  filePaths: string[];
}

export class SourceParsedEvent {
  static channel = 'library.book';

  requestId: string;
  sourceId: string;
  meta: SourceMeta;
  pages: SourcePage[];

  constructor(props: SourceParsedEvent) {
    this.requestId = props.requestId;
    this.sourceId = props.sourceId;
    this.meta = props.meta;
    this.pages = props.pages;
  }
}
