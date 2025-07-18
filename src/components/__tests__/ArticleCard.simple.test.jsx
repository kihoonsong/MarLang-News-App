import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../test/testHelpers';
import ArticleCard from '../ArticleCard';

// Mock dependencies
vi.mock('../../contexts/ArticlesContext', () => ({
  useArticles: () => ({
    categories: [{ name: 'Technology', color: '#1976d2' }]
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

describe('ArticleCard - Simple Tests', () => {
  const mockProps = {
    id: 'test-1',
    title: 'Test Article',
    summary: 'Test summary',
    category: 'Technology',
    publishedAt: '2024-01-15T10:00:00Z',
    image: 'https://example.com/image.jpg'
  };

  it('renders article title', () => {
    renderWithProviders(<ArticleCard {...mockProps} />);
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('renders article category', () => {
    renderWithProviders(<ArticleCard {...mockProps} />);
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('renders article summary', () => {
    renderWithProviders(<ArticleCard {...mockProps} />);
    expect(screen.getByText('Test summary')).toBeInTheDocument();
  });
});