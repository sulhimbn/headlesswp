import { http, HttpResponse, delay } from 'msw';
import { mockPosts, mockCategories, mockTags, mockMedia, mockAuthors } from '../data/wordpress';

const BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json';

export const handlers = [
  http.get(`${BASE_URL}/wp/v2/posts`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const search = url.searchParams.get('search');
    const categories = url.searchParams.get('categories');
    const slug = url.searchParams.get('slug');

    let filteredPosts = [...mockPosts];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredPosts = filteredPosts.filter(
        p => p.title.rendered.toLowerCase().includes(searchLower) ||
             p.content.rendered.toLowerCase().includes(searchLower)
      );
    }

    if (categories) {
      const catIds = categories.split(',').map(Number);
      filteredPosts = filteredPosts.filter(p =>
        p.categories.some(c => catIds.includes(c))
      );
    }

    if (slug) {
      filteredPosts = filteredPosts.filter(p => p.slug === slug);
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedPosts = filteredPosts.slice(start, end);

    const totalPages = Math.ceil(filteredPosts.length / perPage);

    return HttpResponse.json(paginatedPosts, {
      headers: {
        'X-WP-Total': String(filteredPosts.length),
        'X-WP-TotalPages': String(totalPages)
      }
    });
  }),

  http.get(`${BASE_URL}/wp/v2/posts/:id`, async ({ params }) => {
    await delay(100);
    const post = mockPosts.find(p => p.id === Number(params.id));
    if (!post) {
      return HttpResponse.json({ code: 'rest_post_invalid_id', message: 'Invalid post ID.' }, { status: 404 });
    }
    return HttpResponse.json(post);
  }),

  http.get(`${BASE_URL}/wp/v2/categories`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const perPage = parseInt(url.searchParams.get('per_page') || '100');
    const slug = url.searchParams.get('slug');

    let filtered = [...mockCategories];

    if (slug) {
      filtered = filtered.filter(c => c.slug === slug);
    }

    return HttpResponse.json(filtered.slice(0, perPage));
  }),

  http.get(`${BASE_URL}/wp/v2/categories/:id`, async ({ params }) => {
    await delay(100);
    const category = mockCategories.find(c => c.id === Number(params.id));
    if (!category) {
      return HttpResponse.json({ code: 'rest_term_invalid', message: 'Invalid category ID.' }, { status: 404 });
    }
    return HttpResponse.json(category);
  }),

  http.get(`${BASE_URL}/wp/v2/tags`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const perPage = parseInt(url.searchParams.get('per_page') || '100');
    const slug = url.searchParams.get('slug');

    let filtered = [...mockTags];

    if (slug) {
      filtered = filtered.filter(t => t.slug === slug);
    }

    return HttpResponse.json(filtered.slice(0, perPage));
  }),

  http.get(`${BASE_URL}/wp/v2/tags/:id`, async ({ params }) => {
    await delay(100);
    const tag = mockTags.find(t => t.id === Number(params.id));
    if (!tag) {
      return HttpResponse.json({ code: 'rest_term_invalid', message: 'Invalid tag ID.' }, { status: 404 });
    }
    return HttpResponse.json(tag);
  }),

  http.get(`${BASE_URL}/wp/v2/media`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const perPage = parseInt(url.searchParams.get('per_page') || '100');
    const include = url.searchParams.get('include');

    let filtered = [...mockMedia];

    if (include) {
      const ids = include.split(',').map(Number);
      filtered = filtered.filter(m => ids.includes(m.id));
    }

    return HttpResponse.json(filtered.slice(0, perPage));
  }),

  http.get(`${BASE_URL}/wp/v2/media/:id`, async ({ params }) => {
    await delay(100);
    const media = mockMedia.find(m => m.id === Number(params.id));
    if (!media) {
      return HttpResponse.json({ code: 'rest_media_invalid_id', message: 'Invalid media ID.' }, { status: 404 });
    }
    return HttpResponse.json(media);
  }),

  http.get(`${BASE_URL}/wp/v2/users`, async ({ request }) => {
    await delay(100);
    const url = new URL(request.url);
    const perPage = parseInt(url.searchParams.get('per_page') || '100');

    return HttpResponse.json(mockAuthors.slice(0, perPage));
  }),

  http.get(`${BASE_URL}/wp/v2/users/:id`, async ({ params }) => {
    await delay(100);
    const author = mockAuthors.find(a => a.id === Number(params.id));
    if (!author) {
      return HttpResponse.json({ code: 'rest_user_invalid_id', message: 'Invalid user ID.' }, { status: 404 });
    }
    return HttpResponse.json(author);
  })
];