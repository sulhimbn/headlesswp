import { cacheKeys } from './cacheKeyFactory';

export const cacheDependencies = {
  post: (
    _postId: number | string,
    categories: number[],
    tags: number[],
    mediaId: number
  ): string[] => {
    const deps: string[] = [];
    categories.forEach((catId) => deps.push(cacheKeys.category(catId.toString())));
    tags.forEach((tagId) => deps.push(cacheKeys.tag(tagId.toString())));
    if (mediaId > 0) deps.push(cacheKeys.media(mediaId));
    return deps;
  },

  postsList: (categories: number[] = [], tags: number[] = []): string[] => {
    const deps: string[] = [];
    categories.forEach((catId) => deps.push(cacheKeys.category(catId.toString())));
    tags.forEach((tagId) => deps.push(cacheKeys.tag(tagId.toString())));
    return deps;
  },

  media: () => [],

  author: () => [],

  categories: () => [],

  tags: () => [],
};
