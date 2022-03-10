export class SourceParsingTimedoutException extends Error {
  constructor() {
    super();

    this.name = 'SourceParsingTimedoutException';
  }
}
