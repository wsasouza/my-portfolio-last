export interface Project {
  name: string;
  description: string;
  link: { href: string; label: string };
  logo?: string;
}

export interface ProjectWithId extends Project {
  id: string;
} 