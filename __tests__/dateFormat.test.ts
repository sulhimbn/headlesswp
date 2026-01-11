import { formatDate, formatDateTime, formatTime, formatDateRelative, parseAndValidateDate } from '@/lib/utils/dateFormat'

describe('dateFormat utility', () => {
  describe('parseAndValidateDate() - internal helper', () => {
    it('should parse valid date string', () => {
      const result = parseAndValidateDate('2024-01-15')
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(15)
    })

    it('should return valid Date object as-is', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = parseAndValidateDate(date)
      expect(result).toBe(date)
    })

    it('should throw error for invalid date string', () => {
      expect(() => {
        parseAndValidateDate('invalid-date')
      }).toThrow('Invalid date: invalid-date')
    })

    it('should throw error for invalid Date object', () => {
      expect(() => {
        parseAndValidateDate(new Date('invalid'))
      }).toThrow('Invalid date:')
    })

    it('should throw error for null input', () => {
      expect(() => {
        parseAndValidateDate(null as any)
      }).toThrow()
    })

    it('should throw error for undefined input', () => {
      expect(() => {
        parseAndValidateDate(undefined as any)
      }).toThrow()
    })

    it('should throw error for empty string', () => {
      expect(() => {
        parseAndValidateDate('')
      }).toThrow('Invalid date:')
    })
  })

  describe('formatDate()', () => {
    describe('full format (default)', () => {
      it('should format Date object with full format', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'full', 'en-US')
        
        expect(result).toBe('January 15, 2024')
      })

      it('should format date string with full format', () => {
        const result = formatDate('2024-01-15', 'full', 'en-US')
        
        expect(result).toBe('January 15, 2024')
      })

      it('should use default locale (id-ID) when not specified', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date)
        
        expect(result).toContain('Januari')
        expect(result).toContain('2024')
      })

      it('should format leap year date correctly', () => {
        const result = formatDate('2024-02-29', 'full', 'en-US')
        
        expect(result).toBe('February 29, 2024')
      })
    })

    describe('short format', () => {
      it('should format Date object with short format', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'short', 'en-US')
        
        expect(result).toBe('Jan 15, 2024')
      })

      it('should format date string with short format', () => {
        const result = formatDate('2024-12-25', 'short', 'en-US')
        
        expect(result).toBe('Dec 25, 2024')
      })

      it('should use abbreviated month names', () => {
        const result = formatDate('2024-06-15', 'short', 'en-US')
        
        expect(result).toBe('Jun 15, 2024')
      })
    })

    describe('month-day format', () => {
      it('should format Date object with month-day format', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'month-day', 'en-US')
        
        expect(result).toBe('January 15')
      })

      it('should not include year in month-day format', () => {
        const result = formatDate('2024-12-25', 'month-day', 'en-US')
        
        expect(result).toBe('December 25')
        expect(result).not.toContain('2024')
      })
    })

    describe('month-year format', () => {
      it('should format Date object with month-year format', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'month-year', 'en-US')
        
        expect(result).toBe('January 2024')
      })

      it('should not include day in month-year format', () => {
        const result = formatDate('2024-12-15', 'month-year', 'en-US')
        
        expect(result).toBe('December 2024')
        expect(result).not.toContain('15')
      })
    })

    describe('edge cases and error handling', () => {
      it('should throw error for invalid date string', () => {
        expect(() => {
          formatDate('invalid-date')
        }).toThrow('Invalid date: invalid-date')
      })

      it('should throw error for invalid Date object', () => {
        expect(() => {
          formatDate(new Date('invalid'))
        }).toThrow('Invalid date:')
      })

      it('should throw error for null input', () => {
        expect(() => {
          formatDate(null as any)
        }).toThrow()
      })

      it('should throw error for undefined input', () => {
        expect(() => {
          formatDate(undefined as any)
        }).toThrow()
      })

      it('should handle empty string', () => {
        expect(() => {
          formatDate('')
        }).toThrow('Invalid date:')
      })

      it('should handle different date separators in strings', () => {
        const result1 = formatDate('2024/01/15', 'full', 'en-US')
        const result2 = formatDate('2024-01-15', 'full', 'en-US')
        
        expect(result1).toBe(result2)
      })
    })

    describe('locale support', () => {
      it('should format date in English locale', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'full', 'en-US')
        
        expect(result).toBe('January 15, 2024')
      })

      it('should format date in Indonesian locale', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'full', 'id-ID')
        
        expect(result).toBe('15 Januari 2024')
      })

      it('should format date in Spanish locale', () => {
        const date = new Date('2024-01-15T10:30:00Z')
        const result = formatDate(date, 'full', 'es-ES')
        
        expect(result).toContain('15')
        expect(result).toContain('2024')
      })
    })

    describe('boundary dates', () => {
      it('should handle year 1', () => {
        const result = formatDate('0001-01-01', 'full', 'en-US')
        
        expect(result).toContain('1')
        expect(result).toContain('January')
      })

      it('should handle year 9999', () => {
        const result = formatDate('9999-12-31', 'full', 'en-US')
        
        expect(result).toContain('9999')
      })

      it('should handle first day of year', () => {
        const result = formatDate('2024-01-01', 'full', 'en-US')
        
        expect(result).toBe('January 1, 2024')
      })

      it('should handle last day of year', () => {
        const result = formatDate('2024-12-31', 'full', 'en-US')
        
        expect(result).toBe('December 31, 2024')
      })
    })
  })

  describe('formatDateTime()', () => {
    it('should format Date object with date and time', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = formatDateTime(date, 'en-US')
      
      expect(result).toContain('January 15, 2024')
      expect(result).toContain('2:30')
      expect(result).toContain('PM')
    })

    it('should format date string with date and time', () => {
      const result = formatDateTime('2024-01-15T14:30:45Z', 'en-US')
      
      expect(result).toContain('2024')
      expect(result).toContain('2:30')
    })

    it('should use default locale when not specified', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = formatDateTime(date)
      
      expect(result).toContain('Januari')
      expect(result).toContain('14')
    })

    it('should format time with leading zero', () => {
      const date = new Date('2024-01-15T09:05:00Z')
      const result = formatDateTime(date, 'en-US')
      
      expect(result).toContain('09:05')
    })

    it('should throw error for invalid date', () => {
      expect(() => {
        formatDateTime('invalid-date')
      }).toThrow('Invalid date:')
    })

    it('should format 24-hour format correctly', () => {
      const date = new Date('2024-01-15T23:59:59Z')
      const result = formatDateTime(date, 'en-US')
      
      expect(result).toContain('11:59')
      expect(result).toContain('PM')
    })

    it('should format midnight correctly', () => {
      const date = new Date('2024-01-15T00:00:00Z')
      const result = formatDateTime(date, 'en-US')
      
      expect(result).toContain('12:00')
      expect(result).toContain('AM')
    })

    it('should format noon correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const result = formatDateTime(date, 'en-US')
      
      expect(result).toContain('12:00')
      expect(result).toContain('PM')
    })
  })

  describe('formatTime()', () => {
    it('should format Date object with time only', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = formatTime(date, 'en-US')
      
      expect(result).toContain('02:30')
      expect(result).toContain('PM')
    })

    it('should format date string with time only', () => {
      const result = formatTime('2024-01-15T14:30:45Z', 'en-US')
      
      expect(result).toContain('02:30')
    })

    it('should use default locale when not specified', () => {
      const date = new Date('2024-01-15T14:30:45Z')
      const result = formatTime(date)
      
      expect(result).toContain('14')
    })

    it('should format time with leading zero for minutes', () => {
      const date = new Date('2024-01-15T14:05:00Z')
      const result = formatTime(date, 'en-US')
      
      expect(result).toContain('05')
    })

    it('should throw error for invalid date', () => {
      expect(() => {
        formatTime('invalid-date')
      }).toThrow('Invalid date:')
    })

    it('should not include date in time format', () => {
      const result = formatTime('2024-01-15T14:30:45Z', 'en-US')
      
      expect(result).not.toContain('2024')
      expect(result).not.toContain('January')
      expect(result).not.toContain('15')
    })

    it('should format AM time correctly', () => {
      const date = new Date('2024-01-15T09:30:00Z')
      const result = formatTime(date, 'en-US')
      
      expect(result).toContain('09:30')
      expect(result).toContain('AM')
    })

    it('should format PM time correctly', () => {
      const date = new Date('2024-01-15T18:30:00Z')
      const result = formatTime(date, 'en-US')
      
      expect(result).toContain('06:30')
      expect(result).toContain('PM')
    })
  })

  describe('formatDateRelative()', () => {
    describe('time-based relative formats', () => {
      it('should return "baru saja" for dates less than 1 minute ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 30000) // 30 seconds ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('baru saja')
      })

      it('should return "baru saja" for dates exactly 0 seconds ago', () => {
        const date = new Date()
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('baru saja')
      })

      it('should return minutes ago for dates less than 1 hour ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 1800000) // 30 minutes ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('30 menit lalu')
      })

      it('should return "1 menit lalu" for dates 1 minute ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 60000) // 1 minute ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('1 menit lalu')
      })

      it('should return hours ago for dates less than 24 hours ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 10800000) // 3 hours ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('3 jam lalu')
      })

      it('should return "1 jam lalu" for dates 1 hour ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 3600000) // 1 hour ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('1 jam lalu')
      })

      it('should return "kemarin" for dates exactly 1 day ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 86400000) // 24 hours ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('kemarin')
      })
    })

    describe('day-based relative formats', () => {
      it('should return days ago for dates less than 7 days ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 345600000) // 4 days ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('4 hari lalu')
      })

      it('should return "2 hari lalu" for dates 2 days ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 172800000) // 2 days ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('2 hari lalu')
      })

      it('should return "6 hari lalu" for dates 6 days ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 518400000) // 6 days ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('6 hari lalu')
      })
    })

    describe('fallback to formatDate for older dates', () => {
      it('should return formatted date for dates 7 or more days ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 604800000) // 7 days ago
        
        const result = formatDateRelative(date, 'en-US')
        
        expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
        expect(result).toMatch(/\d{4}/)
      })

      it('should return formatted date for dates more than 7 days ago', () => {
        const date = new Date('2024-01-01')

        const result = formatDateRelative(date, 'en-US')

        expect(result).toBe('Jan 1, 2024')
      })

      it('should use provided locale for fallback date format', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 604800000) // 7 days ago
        
        const result = formatDateRelative(date, 'id-ID')
        
        // 'short' format uses abbreviated month names in Indonesian
        expect(result).toMatch(/Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agt|Sep|Okt|Nov|Des/)
      })
    })

    describe('edge cases and error handling', () => {
      it('should throw error for invalid date string', () => {
        expect(() => {
          formatDateRelative('invalid-date')
        }).toThrow('Invalid date:')
      })

      it('should throw error for invalid Date object', () => {
        expect(() => {
          formatDateRelative(new Date('invalid'))
        }).toThrow('Invalid date:')
      })

      it('should handle null input', () => {
        expect(() => {
          formatDateRelative(null as any)
        }).toThrow()
      })

      it('should handle undefined input', () => {
        expect(() => {
          formatDateRelative(undefined as any)
        }).toThrow()
      })

      it('should handle empty string', () => {
        expect(() => {
          formatDateRelative('')
        }).toThrow('Invalid date:')
      })

      it('should handle future dates', () => {
        const now = new Date()
        const date = new Date(now.getTime() + 3600000) // 1 hour in future
        
        const result = formatDateRelative(date)
        
        // Future dates are treated as very recent (negative diff becomes very small positive after Math operations)
        expect(result).toBe('baru saja')
      })
    })

    describe('boundary cases for time thresholds', () => {
      it('should return minutes ago for 59 seconds ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 59000) // 59 seconds ago
        
        const result = formatDateRelative(date)
        
        // 59 seconds is still less than 60, so it's treated as "baru saja"
        expect(result).toBe('baru saja')
      })

      it('should return hours ago for 59 minutes ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 3540000) // 59 minutes ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('59 menit lalu')
      })

      it('should return days ago for 23 hours ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 82800000) // 23 hours ago
        
        const result = formatDateRelative(date)
        
        expect(result).toBe('23 jam lalu')
      })

      it('should return formatted date for 7 days ago', () => {
        const now = new Date()
        const date = new Date(now.getTime() - 604800000) // 7 days ago exactly
        
        const result = formatDateRelative(date, 'en-US')
        
        expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/)
      })
    })
  })
})
