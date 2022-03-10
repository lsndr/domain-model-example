import { Aggregate, AggregateProperties } from '../../../shared/domain';

export interface PageProperties extends AggregateProperties {
  titles: string[] | null;
  content: string;
}

export class Page extends Aggregate {
  titles: string[] | null;
  content: string;

  private constructor(props: PageProperties) {
    super(props);

    this.titles = props.titles;
    this.content = props.content;
  }

  static create(props: Pick<PageProperties, 'id' | 'content'>) {
    const book = new this({
      id: props.id,
      titles: null,
      content: props.content,
    });

    return book;
  }
}
