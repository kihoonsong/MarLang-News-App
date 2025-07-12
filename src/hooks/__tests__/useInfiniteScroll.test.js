import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useInfiniteScroll } from '../useInfiniteScroll'

describe('useInfiniteScroll', () => {
  it('initializes with correct default values', () => {
    const testItems = ['item1', 'item2', 'item3']
    const { result } = renderHook(() => 
      useInfiniteScroll(testItems, 2, 2)
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.hasMore).toBe(true)
  })

  it('loads more items when loadMore is called', async () => {
    const testItems = Array.from({ length: 10 }, (_, i) => `item${i + 1}`)
    const { result } = renderHook(() => 
      useInfiniteScroll(testItems, 3, 3)
    )

    await act(async () => {
      result.current.loadMore()
    })

    expect(result.current.visibleItems.length).toBeGreaterThan(3)
  })

  it('handles empty array gracefully', () => {
    const { result } = renderHook(() => 
      useInfiniteScroll([], 3, 3)
    )

    expect(result.current.visibleItems).toEqual([])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('sets hasMore to false when all items are loaded', () => {
    const testItems = ['item1', 'item2']
    const { result } = renderHook(() => 
      useInfiniteScroll(testItems, 5, 5) // itemsPerPage > total items
    )

    expect(result.current.hasMore).toBe(false)
  })
})