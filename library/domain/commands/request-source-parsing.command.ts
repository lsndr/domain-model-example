export class RequestSourceParsingCommand {
  static channel = 'library.book';

  requestId: string;
  fileUrl: string;
  fileName: string;

  constructor(props: RequestSourceParsingCommand) {
    this.requestId = props.requestId;
    this.fileUrl = props.fileUrl;
    this.fileName = props.fileName;
  }
}
