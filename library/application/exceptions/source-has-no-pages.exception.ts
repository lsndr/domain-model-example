export class SourceHasNoPagesException extends Error {
  constructor(sourceId: string) {
    super();

    this.name = `Source #${sourceId} has no pages`;
  }
}
