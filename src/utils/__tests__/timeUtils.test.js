import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  convertToUTC,
  isTimeReached,
  formatKoreanTime,
  getCurrentKoreanTime,
  parseScheduledTime
} from '../timeUtils';

describe('timeUtils', () => {
  beforeEach(() => {
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertToUTC', () => {
    it('converts Korean time string to UTC ISO string', () => {
      const koreanTime = '2024-01-15 15:30';
      const utcTime = convertToUTC(koreanTime);
      
      expect(utcTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(utcTime)).toBeInstanceOf(Date);
    });

    it('handles different date formats', () => {
      const formats = [
        '2024-01-15 15:30',
        '2024/01/15 15:30',
        '2024-1-15 15:30',
        '2024-01-15T15:30'
      ];

      formats.forEach(format => {
        const result = convertToUTC(format);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('handles edge cases gracefully', () => {
      expect(() => convertToUTC('')).not.toThrow();
      expect(() => convertToUTC(null)).not.toThrow();
      expect(() => convertToUTC(undefined)).not.toThrow();
    });

    it('maintains time accuracy', () => {
      const koreanTime = '2024-06-15 12:00'; // Noon in Korea
      const utcTime = convertToUTC(koreanTime);
      const utcDate = new Date(utcTime);
      
      // Korea is UTC+9, so noon in Korea should be 3 AM UTC
      expect(utcDate.getUTCHours()).toBe(3);
    });
  });

  describe('isTimeReached', () => {
    it('returns true when target time has passed', () => {
      const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      
      expect(isTimeReached(pastTime)).toBe(true);
    });

    it('returns false when target time is in the future', () => {
      const futureTime = new Date(Date.now() + 60000).toISOString(); // 1 minute from now
      
      expect(isTimeReached(futureTime)).toBe(false);
    });

    it('handles current time correctly', () => {
      const currentTime = new Date().toISOString();
      
      // Should be true or very close to true
      expect(isTimeReached(currentTime)).toBe(true);
    });

    it('handles invalid time strings gracefully', () => {
      expect(isTimeReached('invalid-time')).toBe(false);
      expect(isTimeReached('')).toBe(false);
      expect(isTimeReached(null)).toBe(false);
      expect(isTimeReached(undefined)).toBe(false);
    });

    it('works with different time formats', () => {
      const pastDate = new Date(Date.now() - 60000);
      const formats = [
        pastDate.toISOString(),
        pastDate.toString(),
        pastDate.getTime().toString()
      ];

      formats.forEach(format => {
        expect(isTimeReached(format)).toBe(true);
      });
    });
  });

  describe('formatKoreanTime', () => {
    it('formats UTC time to Korean time string', () => {
      const utcTime = '2024-01-15T06:30:00.000Z'; // 6:30 AM UTC = 3:30 PM KST
      const koreanTime = formatKoreanTime(utcTime);
      
      expect(koreanTime).toContain('2024');
      expect(koreanTime).toContain('01');
      expect(koreanTime).toContain('15');
      expect(koreanTime).toContain('15'); // 3 PM in 24-hour format
      expect(koreanTime).toContain('30');
    });

    it('handles different UTC time inputs', () => {
      const times = [
        '2024-01-15T00:00:00.000Z',
        '2024-06-15T12:00:00.000Z',
        '2024-12-31T23:59:59.999Z'
      ];

      times.forEach(time => {
        const result = formatKoreanTime(time);
        expect(result).toMatch(/\d{4}.\d{2}.\d{2}/);
      });
    });

    it('handles invalid input gracefully', () => {
      expect(() => formatKoreanTime('invalid')).not.toThrow();
      expect(() => formatKoreanTime('')).not.toThrow();
      expect(() => formatKoreanTime(null)).not.toThrow();
    });

    it('maintains correct timezone conversion', () => {
      const utcMidnight = '2024-01-15T00:00:00.000Z'; // Midnight UTC
      const koreanTime = formatKoreanTime(utcMidnight);
      
      // Should be 9 AM in Korea (UTC+9)
      expect(koreanTime).toContain('09');
    });
  });

  describe('getCurrentKoreanTime', () => {
    it('returns current Korean time as Date object', () => {
      const koreanTime = getCurrentKoreanTime();
      
      expect(koreanTime).toBeInstanceOf(Date);
      expect(koreanTime.getTime()).toBeGreaterThan(0);
    });

    it('accepts optional date input', () => {
      const inputDate = new Date('2024-01-15T12:00:00.000Z');
      const koreanTime = getCurrentKoreanTime(inputDate);
      
      expect(koreanTime).toBeInstanceOf(Date);
      // Should be 9 hours ahead of UTC input
      expect(koreanTime.getHours()).toBe(21); // 12 + 9 = 21
    });

    it('handles string date input', () => {
      const dateString = '2024-01-15T12:00:00.000Z';
      const koreanTime = getCurrentKoreanTime(dateString);
      
      expect(koreanTime).toBeInstanceOf(Date);
    });

    it('returns current time when no input provided', () => {
      const before = Date.now();
      const koreanTime = getCurrentKoreanTime();
      const after = Date.now();
      
      const koreanTimeMs = koreanTime.getTime();
      expect(koreanTimeMs).toBeGreaterThanOrEqual(before - 1000); // Allow 1 second tolerance
      expect(koreanTimeMs).toBeLessThanOrEqual(after + 1000);
    });
  });

  describe('parseScheduledTime', () => {
    it('parses scheduled time string correctly', () => {
      const scheduledTime = '2024-01-15 15:30';
      const result = parseScheduledTime(scheduledTime);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January is 0
      expect(result.getDate()).toBe(15);
    });

    it('handles different time formats', () => {
      const formats = [
        '2024-01-15 15:30',
        '2024/01/15 15:30',
        '2024-1-15 3:30 PM',
        '2024-01-15T15:30:00'
      ];

      formats.forEach(format => {
        const result = parseScheduledTime(format);
        expect(result).toBeInstanceOf(Date);
      });
    });

    it('returns null for invalid input', () => {
      const invalidInputs = [
        'invalid-date',
        '',
        null,
        undefined,
        '2024-13-45 25:70' // Invalid date/time
      ];

      invalidInputs.forEach(input => {
        const result = parseScheduledTime(input);
        expect(result).toBeNull();
      });
    });

    it('handles timezone considerations', () => {
      const scheduledTime = '2024-01-15 15:30';
      const result = parseScheduledTime(scheduledTime);
      
      // Should parse as Korean time
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('timezone handling', () => {
    it('correctly handles daylight saving time transitions', () => {
      // Test dates around DST transitions
      const beforeDST = '2024-03-01T12:00:00.000Z';
      const afterDST = '2024-04-01T12:00:00.000Z';
      
      const koreanBefore = formatKoreanTime(beforeDST);
      const koreanAfter = formatKoreanTime(afterDST);
      
      // Korea doesn't observe DST, so both should have same offset
      expect(koreanBefore).toContain('21'); // 12 + 9 = 21
      expect(koreanAfter).toContain('21');
    });

    it('handles year boundaries correctly', () => {
      const newYearEve = '2023-12-31T15:30:00.000Z'; // 15:30 UTC on Dec 31
      const koreanTime = formatKoreanTime(newYearEve);
      
      // Should be 00:30 on Jan 1, 2024 in Korea
      expect(koreanTime).toContain('2024');
      expect(koreanTime).toContain('01');
      expect(koreanTime).toContain('01');
    });
  });

  describe('performance and edge cases', () => {
    it('handles large number of operations efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        convertToUTC(`2024-01-15 ${i % 24}:30`);
        isTimeReached(new Date(Date.now() - i * 1000).toISOString());
        formatKoreanTime(new Date().toISOString());
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles extreme dates', () => {
      const extremeDates = [
        '1970-01-01T00:00:00.000Z', // Unix epoch
        '2038-01-19T03:14:07.000Z', // Near 32-bit timestamp limit
        '2100-12-31T23:59:59.999Z'  // Far future
      ];

      extremeDates.forEach(date => {
        expect(() => formatKoreanTime(date)).not.toThrow();
        expect(() => isTimeReached(date)).not.toThrow();
      });
    });

    it('maintains precision with milliseconds', () => {
      const preciseTime = '2024-01-15T12:34:56.789Z';
      const koreanTime = formatKoreanTime(preciseTime);
      
      // Should maintain precision in conversion
      expect(koreanTime).toContain('34'); // minutes
      expect(koreanTime).toContain('56'); // seconds
    });
  });
});