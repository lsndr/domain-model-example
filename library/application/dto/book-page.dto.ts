export interface BookPageDto {
  titles: string[] | null;
  number: number;
  content: string;
  prev: {
    number: number;
    titles: string[] | null;
  } | null;
  next: {
    number: number;
    titles: string[] | null;
  } | null;
  book: {
    id: string;
    coverUrl: string | null;
    title: string | null;
    pages: number;
    description: string | null;
    author: string | null;
  };
}
