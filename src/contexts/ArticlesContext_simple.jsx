import React, { createContext, useContext, useState, useEffect } from 'react';

const ArticlesContext = createContext();

export const useArticles = () => {
  const context = useContext(ArticlesContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticlesProvider');
  }
  return context;
};

export const ArticlesProvider = ({ children }) => {
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Generate comprehensive sample data
  const generateArticles = () => {
    const baseArticles = [
      {
        id: 'article-1',
        title: 'AI Technology Breakthrough in Healthcare',
        category: 'Technology',
        summary: 'Revolutionary AI systems are transforming medical diagnosis and treatment procedures.',
        content: 'Artificial Intelligence is revolutionizing healthcare with groundbreaking advancements in medical diagnosis and treatment.',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
        level: 'Intermediate',
        readingTime: 5,
        source: 'MarLang News'
      },
      {
        id: 'article-2',
        title: 'Climate Change Research Shows Promising Results',
        category: 'Science',
        summary: 'New environmental technologies offer hope for sustainable future solutions.',
        content: 'Recent climate change research has revealed promising developments in environmental technology.',
        image: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
        level: 'Beginner',
        readingTime: 4,
        source: 'MarLang News'
      },
      {
        id: 'article-3',
        title: 'Global Economic Markets Show Recovery Signs',
        category: 'Business',
        summary: 'Market analysis reveals positive trends in global economic recovery.',
        content: 'Global economic markets are showing significant signs of recovery following recent challenges.',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
        level: 'Advanced',
        readingTime: 6,
        source: 'MarLang News'
      },
      {
        id: 'article-4',
        title: 'Cultural Heritage Preservation Through Technology',
        category: 'Culture',
        summary: 'Digital preservation methods are revolutionizing cultural heritage conservation.',
        content: 'Technology is playing a crucial role in preserving cultural heritage for future generations.',
        image: 'https://images.unsplash.com/photo-1518709594023-6eab9bab7b23?auto=format&fit=crop&w=800&q=80',
        level: 'Intermediate',
        readingTime: 5,
        source: 'MarLang News'
      },
      {
        id: 'article-5',
        title: 'Social Media Impact on Modern Society',
        category: 'Society',
        summary: 'Analyzing the profound effects of social media on contemporary social structures.',
        content: 'Social media has fundamentally transformed how people communicate and share information.',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        level: 'Beginner',
        readingTime: 4,
        source: 'MarLang News'
      }
    ];

    // Generate 20 articles with random dates
    const articles = [];
    for (let i = 0; i < 20; i++) {
      const baseArticle = baseArticles[i % baseArticles.length];
      const daysAgo = Math.floor(Math.random() * 30);
      const publishedAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));

      articles.push({
        ...baseArticle,
        id: `article-${i + 1}`,
        title: i === 0 ? baseArticle.title : `${baseArticle.title} ${i + 1}`,
        publishedAt: publishedAt.toISOString(),
        likes: Math.floor(Math.random() * 500) + 50,
        views: Math.floor(Math.random() * 2000) + 100,
        createdAt: publishedAt.toISOString(),
        updatedAt: publishedAt.toISOString()
      });
    }

    return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  };

  // Initialize data
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    try {
      const articles = generateArticles();
      setAllArticles(articles);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError('Failed to load articles');
      console.error('Error generating articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get articles by category
  const getArticlesByCategory = (categoryName, limit = null) => {
    const filtered = allArticles.filter(article => 
      article.category === categoryName
    );
    return limit ? filtered.slice(0, limit) : filtered;
  };

  // Get recent articles (sorted by date)
  const getRecentArticles = (limit = 10) => {
    return allArticles
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  };

  // Get popular articles (sorted by likes)
  const getPopularArticles = (limit = 10) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return allArticles
      .filter(article => new Date(article.publishedAt) >= weekAgo)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  };

  // Refresh data
  const refreshArticles = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      try {
        const articles = generateArticles();
        setAllArticles(articles);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        setError('Failed to refresh articles');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const value = {
    allArticles,
    setAllArticles,
    loading,
    error,
    lastUpdated,
    getArticlesByCategory,
    getRecentArticles,
    getPopularArticles,
    refreshArticles
  };

  return (
    <ArticlesContext.Provider value={value}>
      {children}
    </ArticlesContext.Provider>
  );
};