import { UseQueryOptions, useQuery } from 'react-query';

import { http } from '@/leancloud';
import { CategorySchema } from './category';

export interface Article {
  id: string;
  title: string;
  content: string;
  contentSafeHTML: string;
  private: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FetchArticlesOptions {
  page?: number;
  pageSize?: number;
  private?: boolean;
  count?: any;
}

export interface FetchArticlesResult {
  data: Article[];
  totalCount?: number;
}

export async function fetchArticles(options: FetchArticlesOptions): Promise<FetchArticlesResult> {
  const { data, headers } = await http.get<Article[]>('/api/2/articles', {
    params: options,
  });
  const totalCount = headers['x-total-count'];
  return {
    data,
    totalCount: totalCount ? parseInt(totalCount) : undefined,
  };
}

export interface UseArticlesOptions extends FetchArticlesOptions {
  queryOptions?: UseQueryOptions<FetchArticlesResult, Error>;
}

export function useArticles({ queryOptions, ...options }: UseArticlesOptions = {}) {
  const { data, ...results } = useQuery({
    queryKey: ['articles', options],
    queryFn: () => fetchArticles(options),
    ...queryOptions,
  });

  return {
    ...results,
    data: data?.data,
    totalCount: data?.totalCount,
  };
}

export async function fetchArticle(id: string) {
  const { data } = await http.get<Article>(`/api/2/articles/${id}`);
  return data;
}

export function useArticle(id: string, options?: UseQueryOptions<Article, Error>) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
    ...options,
  });
}

export interface CreateArticleData {
  title: string;
  content: string;
  private?: boolean;
}

export async function createArticle(data: CreateArticleData) {
  await http.post('/api/2/articles', data);
}

export type UpdateArticleData = Partial<CreateArticleData>;

export async function updateArticle(id: string, data: UpdateArticleData) {
  await http.patch(`/api/2/articles/${id}`, data);
}

export async function deleteArticle(id: string) {
  await http.delete(`/api/2/articles/${id}`);
}

async function fetchRelatedCategories(articleId: string) {
  const { data } = await http.get<CategorySchema[]>(`/api/2/articles/${articleId}/categories`);
  return data;
}

export function useRelatedCategories(articleId: string) {
  return useQuery({
    queryKey: ['article/categories', articleId],
    queryFn: () => fetchRelatedCategories(articleId),
  });
}