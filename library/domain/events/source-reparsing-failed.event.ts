export class SourceReparsingFailedEvent {
  static channel = 'library.book';

  requestId: string;
  sourceId: string;

  constructor(props: SourceReparsingFailedEvent) {
    this.requestId = props.requestId;
    this.sourceId = props.sourceId;
  }
}
