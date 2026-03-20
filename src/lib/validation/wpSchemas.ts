import { z } from 'zod';

export const WordPressPostSchema = z.object({
  id: z.number().int().positive(),
  title: z.object({
    rendered: z.string()
  }),
  content: z.object({
    rendered: z.string()
  }),
  excerpt: z.object({
    rendered: z.string()
  }),
  slug: z.string(),
  date: z.string(),
  modified: z.string(),
  author: z.number().int().nonnegative(),
  featured_media: z.number().int().nonnegative(),
  categories: z.array(z.number().int().nonnegative()),
  tags: z.array(z.number().int().nonnegative()),
  status: z.string(),
  type: z.string(),
  link: z.string().url()
});

export type WordPressPostZod = z.infer<typeof WordPressPostSchema>;

export const WordPressCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  parent: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
  link: z.string().url()
});

export type WordPressCategoryZod = z.infer<typeof WordPressCategorySchema>;

export const WordPressTagSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  count: z.number().int().nonnegative(),
  link: z.string().url()
});

export type WordPressTagZod = z.infer<typeof WordPressTagSchema>;

export const WordPressMediaSchema = z.object({
  id: z.number().int().positive(),
  source_url: z.string().url(),
  title: z.object({
    rendered: z.string()
  }),
  alt_text: z.string(),
  media_type: z.string(),
  mime_type: z.string()
});

export type WordPressMediaZod = z.infer<typeof WordPressMediaSchema>;

export const WordPressAuthorSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  avatar_urls: z.record(z.string(), z.string()),
  link: z.string().url()
});

export type WordPressAuthorZod = z.infer<typeof WordPressAuthorSchema>;

export const WordPressSearchResultSchema = z.object({
  id: z.number().int().positive(),
  title: z.object({
    rendered: z.string()
  }),
  url: z.string().url(),
  type: z.string(),
  subtype: z.string()
});

export type WordPressSearchResultZod = z.infer<typeof WordPressSearchResultSchema>;

export function validateWordPressPost(data: unknown): WordPressPostZod {
  return WordPressPostSchema.parse(data);
}

export function validateWordPressCategory(data: unknown): WordPressCategoryZod {
  return WordPressCategorySchema.parse(data);
}

export function validateWordPressTag(data: unknown): WordPressTagZod {
  return WordPressTagSchema.parse(data);
}

export function validateWordPressMedia(data: unknown): WordPressMediaZod {
  return WordPressMediaSchema.parse(data);
}

export function validateWordPressAuthor(data: unknown): WordPressAuthorZod {
  return WordPressAuthorSchema.parse(data);
}

export function validateWordPressSearchResult(data: unknown): WordPressSearchResultZod {
  return WordPressSearchResultSchema.parse(data);
}

export function validateWordPressPostArray(data: unknown): WordPressPostZod[] {
  return z.array(WordPressPostSchema).parse(data);
}

export function validateWordPressCategoryArray(data: unknown): WordPressCategoryZod[] {
  return z.array(WordPressCategorySchema).parse(data);
}

export function validateWordPressTagArray(data: unknown): WordPressTagZod[] {
  return z.array(WordPressTagSchema).parse(data);
}

export function validateWordPressMediaArray(data: unknown): WordPressMediaZod[] {
  return z.array(WordPressMediaSchema).parse(data);
}