export interface Vacancy {
  url: string;
  title: string;
  company: string;
  description: string;
  publishedAt?: string | null;
  scrapedAt: string;
}

export interface StoredVacancy extends Vacancy {
  id: number;
  isRelevant: number;
  notifiedAt?: string | null;
  createdAt: string;
}
