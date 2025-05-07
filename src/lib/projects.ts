import { db } from '@/lib/firebase-admin';
import { DocumentData } from 'firebase-admin/firestore';

export interface Project {
  name: string;
  description: string;
  link: { href: string; label: string };
  logo?: string;
  tags?: string[];
}

export interface ProjectWithId extends Project {
  id: string;
}

export interface PaginatedProjects {
  projects: ProjectWithId[];
  totalCount: number;
  hasMore: boolean;
}

export async function getAllProjects(): Promise<ProjectWithId[]> {
  try {
    const projectsSnapshot = await db.collection('projects')
      .orderBy('name', 'asc')
      .get();
    
    const projects = projectsSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProjectWithId[];
    
    return projects;
  } catch (error) {
    console.error('Erro ao buscar projetos do Firestore:', error);    
    return [];
  }
}

export async function getPaginatedProjects(page: number = 1, limit: number = 6): Promise<PaginatedProjects> {
  try {    
    const countSnapshot = await db.collection('projects').count().get();
    const totalCount = countSnapshot.data().count;    
    
    const offset = (page - 1) * limit;    
    
    const projectsSnapshot = await db.collection('projects')
      .orderBy('name', 'asc')
      .limit(limit)
      .offset(offset)
      .get();
    
    const projects = projectsSnapshot.docs.map((doc: DocumentData) => ({
      id: doc.id, 
      ...doc.data(),
    })) as ProjectWithId[];
    
    const hasMore = offset + projects.length < totalCount;
    
    return {
      projects,
      totalCount,
      hasMore
    };
  } catch (error) {
    console.error('Erro ao buscar projetos paginados do Firestore:', error);
    return {
      projects: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

export async function getProjectById(id: string): Promise<ProjectWithId | null> {
  try {    
    const doc = await db.collection('projects').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return {
      id: doc.id,
      ...doc.data(),
    } as ProjectWithId;
  } catch (error) {
    console.error('Erro ao buscar projeto do Firestore:', error);
    return null;
  }
} 