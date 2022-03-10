export interface PageDto {
  titles: string[] | null;
  number: number;
  session: {
    id: string;
    finishedAt: Date | null;
  };
  book: {
    id: string;
    pages: number;
  };
}
