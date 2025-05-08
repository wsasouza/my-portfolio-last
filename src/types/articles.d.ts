export interface Article {
  id: string;   
  slug: string; 
  title: string;
  description: string;
  author: string;
  date: string;
  tags?: string[];
}

export interface ArticleData {
  id?: string;
  title: string;
  description: string;
  author: string;
  date: string;
  slug: string;
  content: string;
  imageUrls: Record<string, string>;
  tags?: string[];
}