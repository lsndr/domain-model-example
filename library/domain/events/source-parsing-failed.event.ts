export class SourceParsingFailedEvent {
  static channel = 'library.book';

  requestId: string;

  constructor(props: SourceParsingFailedEvent) {
    this.requestId = props.requestId;
  }
}
