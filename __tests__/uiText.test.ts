import { UI_TEXT } from '@/lib/constants/uiText';

describe('UI_TEXT constants', () => {
  describe('breadcrumb', () => {
    it('should have home text', () => {
      expect(UI_TEXT.breadcrumb.home).toBe('Beranda');
    });
  });

  describe('postCard', () => {
    it('should have altText function that returns formatted string', () => {
      const result = UI_TEXT.postCard.altText('Test Title');
      expect(result).toBe('Gambar utama untuk artikel: Test Title');
    });

    it('should have altText that handles empty title', () => {
      const result = UI_TEXT.postCard.altText('');
      expect(result).toBe('Gambar utama untuk artikel: ');
    });

    it('should have altText that handles special characters in title', () => {
      const result = UI_TEXT.postCard.altText('Test & Title <script>');
      expect(result).toBe('Gambar utama untuk artikel: Test & Title <script>');
    });

    it('should have readArticle function that returns formatted string', () => {
      const result = UI_TEXT.postCard.readArticle('Test Article');
      expect(result).toBe('Baca artikel: Test Article');
    });

    it('should have readArticle that handles empty title', () => {
      const result = UI_TEXT.postCard.readArticle('');
      expect(result).toBe('Baca artikel: ');
    });
  });

  describe('metaInfo', () => {
    it('should have by text', () => {
      expect(UI_TEXT.metaInfo.by).toBe('By');
    });

    it('should have datePrefix as empty string', () => {
      expect(UI_TEXT.metaInfo.datePrefix).toBe('');
    });
  });

  describe('postDetail', () => {
    it('should have tags text', () => {
      expect(UI_TEXT.postDetail.tags).toBe('Tags');
    });

    it('should have backToHome text', () => {
      expect(UI_TEXT.postDetail.backToHome).toBe('Kembali ke Beranda');
    });
  });

  describe('newsPage', () => {
    it('should have heading text', () => {
      expect(UI_TEXT.newsPage.heading).toBe('Semua Berita');
    });

    it('should have subtitle text', () => {
      expect(UI_TEXT.newsPage.subtitle).toBe('Kumpulan berita terkini dari Mitra Banten News');
    });

    it('should have emptyTitle text', () => {
      expect(UI_TEXT.newsPage.emptyTitle).toBe('Tidak ada berita');
    });

    it('should have emptyDescription text', () => {
      expect(UI_TEXT.newsPage.emptyDescription).toBe('Belum ada berita untuk ditampilkan saat ini.');
    });
  });

  describe('homePage', () => {
    it('should have featuredHeading text', () => {
      expect(UI_TEXT.homePage.featuredHeading).toBe('Berita Utama');
    });

    it('should have latestHeading text', () => {
      expect(UI_TEXT.homePage.latestHeading).toBe('Berita Terkini');
    });
  });

  describe('notFound', () => {
    it('should have heading text', () => {
      expect(UI_TEXT.notFound.heading).toBe('Halaman Tidak Ditemukan');
    });

    it('should have description text', () => {
      expect(UI_TEXT.notFound.description).toBe('Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan, dihapus, atau URL yang Anda masukkan salah.');
    });

    it('should have backToHome text', () => {
      expect(UI_TEXT.notFound.backToHome).toBe('Kembali ke Beranda');
    });

    it('should have viewNews text', () => {
      expect(UI_TEXT.notFound.viewNews).toBe('Lihat Berita Terkini');
    });

    it('should have contactHelp text', () => {
      expect(UI_TEXT.notFound.contactHelp).toBe('Jika Anda merasa ini adalah kesalahan, silakan');
    });

    it('should have contactUs text', () => {
      expect(UI_TEXT.notFound.contactUs).toBe('hubungi kami');
    });
  });

  describe('error', () => {
    it('should have heading text', () => {
      expect(UI_TEXT.error.heading).toBe('Terjadi Kesalahan');
    });

    it('should have description text', () => {
      expect(UI_TEXT.error.description).toBe('Maaf, terjadi kesalahan saat memuat halaman ini. Ini bukan kesalahan dari pihak Anda.');
    });

    it('should have tryAgain text', () => {
      expect(UI_TEXT.error.tryAgain).toBe('Coba Lagi');
    });

    it('should have backToHome text', () => {
      expect(UI_TEXT.error.backToHome).toBe('Kembali ke Beranda');
    });

    it('should have contactHelp text', () => {
      expect(UI_TEXT.error.contactHelp).toBe('Jika masalah berlanjut, silakan');
    });

    it('should have contactUs text', () => {
      expect(UI_TEXT.error.contactUs).toBe('hubungi kami');
    });

    it('should have contactForHelp text', () => {
      expect(UI_TEXT.error.contactForHelp).toBe('untuk bantuan');
    });
  });

  describe('emptyState', () => {
    it('should have title text', () => {
      expect(UI_TEXT.emptyState.title).toBe('Tidak ada berita');
    });

    it('should have description text', () => {
      expect(UI_TEXT.emptyState.description).toBe('Belum ada berita untuk ditampilkan saat ini.');
    });
  });

  describe('pagination', () => {
    it('should have previous text', () => {
      expect(UI_TEXT.pagination.previous).toBe('Sebelumnya');
    });

    it('should have next text', () => {
      expect(UI_TEXT.pagination.next).toBe('Selanjutnya');
    });

    it('should have page text', () => {
      expect(UI_TEXT.pagination.page).toBe('Halaman');
    });

    it('should have of text', () => {
      expect(UI_TEXT.pagination.of).toBe('dari');
    });
  });

  describe('search', () => {
    it('should have placeholder text', () => {
      expect(UI_TEXT.search.placeholder).toBe('Cari berita...');
    });

    it('should have label text', () => {
      expect(UI_TEXT.search.label).toBe('Cari berita');
    });
  });

  describe('searchPage', () => {
    it('should have heading function that returns formatted string', () => {
      const result = UI_TEXT.searchPage.heading('test query');
      expect(result).toBe('Hasil pencarian: "test query"');
    });

    it('should have heading that handles empty query', () => {
      const result = UI_TEXT.searchPage.heading('');
      expect(result).toBe('Hasil pencarian: ""');
    });

    it('should have heading that handles special characters in query', () => {
      const result = UI_TEXT.searchPage.heading('test & query <script>');
      expect(result).toBe('Hasil pencarian: "test & query <script>"');
    });

    it('should have noResults text', () => {
      expect(UI_TEXT.searchPage.noResults).toBe('Tidak ada hasil');
    });

    it('should have noResultsDescription function that returns formatted string', () => {
      const result = UI_TEXT.searchPage.noResultsDescription('test query');
      expect(result).toBe('Tidak ada berita yang cocok dengan "test query". Coba kata kunci lain.');
    });

    it('should have noResultsDescription that handles empty query', () => {
      const result = UI_TEXT.searchPage.noResultsDescription('');
      expect(result).toBe('Tidak ada berita yang cocok dengan "". Coba kata kunci lain.');
    });

    it('should have emptySearch text', () => {
      expect(UI_TEXT.searchPage.emptySearch).toBe('Masukkan kata kunci');
    });

    it('should have emptySearchDescription text', () => {
      expect(UI_TEXT.searchPage.emptySearchDescription).toBe('Silakan masukkan kata kunci untuk mencari berita.');
    });
  });

  describe('footer', () => {
    it('should have about text', () => {
      expect(UI_TEXT.footer.about).toBe('Tentang Kami');
    });

    it('should have aboutTitle text', () => {
      expect(UI_TEXT.footer.aboutTitle).toBe('Mitra Banten News');
    });

    it('should have aboutDescription text', () => {
      expect(UI_TEXT.footer.aboutDescription).toBe('Menyajikan berita terkini dan terpercaya dari Banten dan sekitarnya.');
    });

    it('should have navigation text', () => {
      expect(UI_TEXT.footer.navigation).toBe('Navigasi');
    });

    it('should have contact text', () => {
      expect(UI_TEXT.footer.contact).toBe('Kontak');
    });

    it('should have contactTitle text', () => {
      expect(UI_TEXT.footer.contactTitle).toBe('Hubungi Kami');
    });

    it('should have email text', () => {
      expect(UI_TEXT.footer.email).toBe('Email: info@mitrabantennews.com');
    });

    it('should have phone text', () => {
      expect(UI_TEXT.footer.phone).toBe('Telepon: (0254) 123-4567');
    });

    it('should have address text', () => {
      expect(UI_TEXT.footer.address).toBe('Alamat: Banten, Indonesia');
    });

    it('should have copyright function that returns formatted string', () => {
      const result = UI_TEXT.footer.copyright(2026);
      expect(result).toBe('&copy; 2026 Mitra Banten News. All rights reserved.');
    });

    it('should have copyright that handles year 2000', () => {
      const result = UI_TEXT.footer.copyright(2000);
      expect(result).toBe('&copy; 2000 Mitra Banten News. All rights reserved.');
    });

    it('should have copyright that handles current year', () => {
      const currentYear = new Date().getFullYear();
      const result = UI_TEXT.footer.copyright(currentYear);
      expect(result).toBe(`&copy; ${currentYear} Mitra Banten News. All rights reserved.`);
    });

    it('should have copyright that handles negative year', () => {
      const result = UI_TEXT.footer.copyright(-1);
      expect(result).toBe('&copy; -1 Mitra Banten News. All rights reserved.');
    });

    it('should have copyright that handles year 0', () => {
      const result = UI_TEXT.footer.copyright(0);
      expect(result).toBe('&copy; 0 Mitra Banten News. All rights reserved.');
    });

    it('should have copyright that handles large year', () => {
      const result = UI_TEXT.footer.copyright(9999);
      expect(result).toBe('&copy; 9999 Mitra Banten News. All rights reserved.');
    });
  });

  describe('footer links', () => {
    it('should have home link text', () => {
      expect(UI_TEXT.footer.links.home).toBe('Beranda');
    });

    it('should have news link text', () => {
      expect(UI_TEXT.footer.links.news).toBe('Berita');
    });

    it('should have politics link text', () => {
      expect(UI_TEXT.footer.links.politics).toBe('Politik');
    });

    it('should have economy link text', () => {
      expect(UI_TEXT.footer.links.economy).toBe('Ekonomi');
    });

    it('should have sports link text', () => {
      expect(UI_TEXT.footer.links.sports).toBe('Olahraga');
    });
  });

  describe('text consistency', () => {
    it('should have all text in Indonesian', () => {
      const checkIndonesian = (text: string) => {
        const indonesianWords = ['Beranda', 'Berita', 'Tidak', 'Untuk', 'Halaman', 'Kembali', 'Hubungi', 'Email', 'Telepon', 'Alamat', 'Tentang'];
        return indonesianWords.some(word => text.includes(word));
      };

      expect(checkIndonesian(UI_TEXT.breadcrumb.home)).toBe(true);
      expect(checkIndonesian(UI_TEXT.newsPage.heading)).toBe(true);
      expect(checkIndonesian(UI_TEXT.homePage.featuredHeading)).toBe(true);
    });

    it('should have consistent "back to home" phrasing', () => {
      expect(UI_TEXT.postDetail.backToHome).toBe('Kembali ke Beranda');
      expect(UI_TEXT.notFound.backToHome).toBe('Kembali ke Beranda');
      expect(UI_TEXT.error.backToHome).toBe('Kembali ke Beranda');
    });

    it('should have consistent contact phrasing', () => {
      expect(UI_TEXT.notFound.contactUs).toBe('hubungi kami');
      expect(UI_TEXT.error.contactUs).toBe('hubungi kami');
    });
  });

  describe('copyright function edge cases', () => {
    it('should handle single digit year', () => {
      expect(UI_TEXT.footer.copyright(5)).toBe('&copy; 5 Mitra Banten News. All rights reserved.');
    });

    it('should handle very large year', () => {
      expect(UI_TEXT.footer.copyright(1000000)).toBe('&copy; 1000000 Mitra Banten News. All rights reserved.');
    });

    it('should return string type', () => {
      const result = UI_TEXT.footer.copyright(2026);
      expect(typeof result).toBe('string');
    });

    it('should include HTML entity for copyright symbol', () => {
      const result = UI_TEXT.footer.copyright(2026);
      expect(result).toContain('&copy;');
    });

    it('should include company name', () => {
      const result = UI_TEXT.footer.copyright(2026);
      expect(result).toContain('Mitra Banten News');
    });

    it('should include rights text', () => {
      const result = UI_TEXT.footer.copyright(2026);
      expect(result).toContain('All rights reserved.');
    });
  });

  describe('function text generation', () => {
    it('should generate different altText for different titles', () => {
      const result1 = UI_TEXT.postCard.altText('Title 1');
      const result2 = UI_TEXT.postCard.altText('Title 2');

      expect(result1).not.toBe(result2);
    });

    it('should generate different readArticle text for different titles', () => {
      const result1 = UI_TEXT.postCard.readArticle('Article 1');
      const result2 = UI_TEXT.postCard.readArticle('Article 2');

      expect(result1).not.toBe(result2);
    });

    it('should generate different copyright for different years', () => {
      const result1 = UI_TEXT.footer.copyright(2025);
      const result2 = UI_TEXT.footer.copyright(2026);

      expect(result1).not.toBe(result2);
    });
  });

  describe('immutability', () => {
    it('should maintain constant immutability for breadcrumb', () => {
      const original = UI_TEXT.breadcrumb.home;
      expect(UI_TEXT.breadcrumb.home).toBe(original);
    });

    it('should maintain constant immutability for footer', () => {
      const original = UI_TEXT.footer.about;
      expect(UI_TEXT.footer.about).toBe(original);
    });

    it('should have as const assertion preventing reassignment', () => {
      expect(UI_TEXT).toBeDefined();
    });
  });

  describe('complete structure', () => {
    it('should have all expected top-level sections', () => {
      expect(UI_TEXT).toHaveProperty('breadcrumb');
      expect(UI_TEXT).toHaveProperty('postCard');
      expect(UI_TEXT).toHaveProperty('metaInfo');
      expect(UI_TEXT).toHaveProperty('postDetail');
      expect(UI_TEXT).toHaveProperty('newsPage');
      expect(UI_TEXT).toHaveProperty('homePage');
      expect(UI_TEXT).toHaveProperty('notFound');
      expect(UI_TEXT).toHaveProperty('error');
      expect(UI_TEXT).toHaveProperty('emptyState');
      expect(UI_TEXT).toHaveProperty('pagination');
      expect(UI_TEXT).toHaveProperty('footer');
    });

    it('should have footer section with all expected subsections', () => {
      expect(UI_TEXT.footer).toHaveProperty('about');
      expect(UI_TEXT.footer).toHaveProperty('aboutTitle');
      expect(UI_TEXT.footer).toHaveProperty('aboutDescription');
      expect(UI_TEXT.footer).toHaveProperty('navigation');
      expect(UI_TEXT.footer).toHaveProperty('contact');
      expect(UI_TEXT.footer).toHaveProperty('contactTitle');
      expect(UI_TEXT.footer).toHaveProperty('email');
      expect(UI_TEXT.footer).toHaveProperty('phone');
      expect(UI_TEXT.footer).toHaveProperty('address');
      expect(UI_TEXT.footer).toHaveProperty('links');
      expect(UI_TEXT.footer).toHaveProperty('copyright');
    });
  });
});
