import { SourceParsingFailedEvent } from '../../domain';

export class SourceParsingFailedException extends Error {
  constructor(public event: SourceParsingFailedEvent) {
    super();

    this.name = 'SourceParsingFailedException';
  }
}
