export class RequestSourceReparsingCommand {
  static channel = 'library.book';

  requestId: string;
  fileUrl: string;
  fileName: string;
  sourceId: string;

  constructor(props: RequestSourceReparsingCommand) {
    this.requestId = props.requestId;
    this.sourceId = props.sourceId;
    this.fileUrl = props.fileUrl;
    this.fileName = props.fileName;
  }
}
