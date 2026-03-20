import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly logo: Locator
  readonly navigation: Locator
  readonly searchButton: Locator
  readonly darkModeToggle: Locator
  readonly featuredSection: Locator
  readonly latestSection: Locator
  readonly mainContent: Locator

  constructor(page: Page) {
    this.page = page
    this.logo = page.locator('header a:has-text("Mitra Banten News")').first()
    this.navigation = page.locator('header nav')
    this.searchButton = page.locator('header button[aria-label*="cari"]').first()
    this.darkModeToggle = page.locator('header button[aria-label*="mode"]').first()
    this.featuredSection = page.locator('section[aria-labelledby="featured"]')
    this.latestSection = page.locator('section[aria-labelledby="latest"]')
    this.mainContent = page.locator('#main-content')
  }

  async goto() {
    await this.page.goto('/')
  }

  async clickNewsLink() {
    await this.page.locator('header nav a:has-text("Berita")').click()
  }

  async toggleDarkMode() {
    await this.darkModeToggle.click()
  }

  async openSearch() {
    await this.searchButton.click()
  }
}

export class NewsPage {
  readonly page: Page
  readonly mainContent: Locator
  readonly posts: Locator
  readonly pagination: Locator

  constructor(page: Page) {
    this.page = page
    this.mainContent = page.locator('#main-content')
    this.posts = page.locator('article')
    this.pagination = page.locator('nav[aria-label="pagination"], .pagination')
  }

  async goto(pageNumber?: number) {
    const url = pageNumber ? `/berita?page=${pageNumber}` : '/berita'
    await this.page.goto(url)
  }

  async clickFirstPost(): Promise<string | null> {
    const firstPost = this.posts.locator('a[href^="/berita/"]').first()
    return await firstPost.getAttribute('href')
  }
}

export class PostPage {
  readonly page: Page
  readonly mainContent: Locator
  readonly article: Locator
  readonly breadcrumb: Locator

  constructor(page: Page) {
    this.page = page
    this.mainContent = page.locator('#main-content')
    this.article = page.locator('article')
    this.breadcrumb = page.locator('nav[aria-label="breadcrumb"], .breadcrumb, nav a[href="/"]')
  }

  async goto(slug: string) {
    await this.page.goto(`/berita/${slug}`)
  }
}

export class SearchPage {
  readonly page: Page
  readonly mainContent: Locator
  readonly searchInput: Locator
  readonly results: Locator

  constructor(page: Page) {
    this.page = page
    this.mainContent = page.locator('#main-content')
    this.searchInput = page.locator('input[type="search"], input[placeholder*="ari"]').first()
    this.results = page.locator('article')
  }

  async goto(query?: string) {
    const url = query ? `/cari?q=${encodeURIComponent(query)}` : '/cari'
    await this.page.goto(url)
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.searchInput.press('Enter')
  }
}

export class CategoryPage {
  readonly page: Page
  readonly mainContent: Locator
  readonly posts: Locator

  constructor(page: Page) {
    this.page = page
    this.mainContent = page.locator('#main-content')
    this.posts = page.locator('article')
  }

  async goto(slug: string) {
    await this.page.goto(`/kategori/${slug}`)
  }
}

export class NotFoundPage {
  readonly page: Page
  readonly errorCode: Locator
  readonly heading: Locator
  readonly backToHomeButton: Locator
  readonly viewNewsButton: Locator

  constructor(page: Page) {
    this.page = page
    this.errorCode = page.locator('text=404')
    this.heading = page.locator('text=Halaman Tidak Ditemukan')
    this.backToHomeButton = page.locator('a[href="/"]').first()
    this.viewNewsButton = page.locator('a:has-text("Lihat Berita")')
  }

  async goto() {
    await this.page.goto('/page-not-found-test-12345')
  }

  async clickBackToHome() {
    await this.backToHomeButton.click()
  }
}
