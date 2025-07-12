import { describe, it, expect } from 'vitest'
import { 
  getKoreanDateTimeLocalValue,
  convertLocalToKoreanISO,
  formatKoreanTime 
} from '../timeUtils'

describe('timeUtils', () => {
  describe('getKoreanDateTimeLocalValue', () => {
    it('converts date to Korean timezone datetime-local format', () => {
      const testDate = new Date('2024-01-01T12:00:00Z')
      const result = getKoreanDateTimeLocalValue(testDate)
      
      // 결과는 YYYY-MM-DDTHH:mm 형식이어야 함
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })

    it('handles current date when no date provided', () => {
      const result = getKoreanDateTimeLocalValue()
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    })
  })

  describe('convertLocalToKoreanISO', () => {
    it('converts local datetime string to Korean ISO string', () => {
      const localDateTime = '2024-01-01T12:00'
      const result = convertLocalToKoreanISO(localDateTime)
      
      // 결과는 ISO 형식이어야 함
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('formatKoreanTime', () => {
    it('formats date to Korean time format', () => {
      const testDate = new Date('2024-01-01T12:00:00Z')
      const result = formatKoreanTime(testDate)
      
      // 한국 시간 형식인지 확인
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('handles Date objects and timestamp strings', () => {
      const dateObj = new Date('2024-01-01T12:00:00Z')
      const timestamp = '2024-01-01T12:00:00Z'
      
      const resultFromDate = formatKoreanTime(dateObj)
      const resultFromString = formatKoreanTime(timestamp)
      
      expect(typeof resultFromDate).toBe('string')
      expect(typeof resultFromString).toBe('string')
    })
  })
})