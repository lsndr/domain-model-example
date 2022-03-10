export class SourceAlreadyParsedEvent {
  static channel = 'library.book';

  requestId: string;
  sourceId: string;

  constructor(props: SourceAlreadyParsedEvent) {
    this.requestId = props.requestId;
    this.sourceId = props.sourceId;
  }
}
