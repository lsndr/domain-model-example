export interface SessionDto {
  id: string;
  telegramId: string | null;
  fileName: string | null;
  finishedAt: Date | null;
  currentPage: number;
  book: {
    id: string;
    coverUrl: string | null;
    title: string | null;
    author: string | null;
    description: string | null;
  };
}
