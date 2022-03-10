import { SourceReparsingFailedEvent } from '../../domain';

export class SourceReparsingFailedException extends Error {
  constructor(public event: SourceReparsingFailedEvent) {
    super();

    this.name = 'SourceReparsingFailedException';
  }
}
