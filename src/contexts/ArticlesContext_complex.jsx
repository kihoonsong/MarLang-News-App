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
        content: 'Artificial Intelligence is revolutionizing healthcare with groundbreaking advancements in medical diagnosis and treatment. Machine learning algorithms can now analyze medical images with unprecedented accuracy, often surpassing human specialists. AI-powered diagnostic tools are being deployed in hospitals worldwide, helping doctors detect diseases earlier and more accurately. These systems can analyze thousands of medical scans in minutes, identifying patterns that might be missed by human eyes. The integration of AI in healthcare is not just improving diagnosis but also personalized treatment plans, drug discovery, and patient monitoring systems.',
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
        content: 'Recent climate change research has revealed promising developments in environmental technology and sustainable solutions. Scientists worldwide are developing innovative approaches to reduce carbon emissions and combat global warming. New renewable energy technologies are becoming more efficient and cost-effective, making clean energy accessible to more communities. Advanced carbon capture systems are being tested in various industrial settings, showing potential for significant emission reductions. The research also highlights the importance of international cooperation in addressing climate challenges and implementing sustainable policies.',
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
        content: 'Global economic markets are showing significant signs of recovery following recent challenges. Financial analysts report positive trends across major stock markets, with technology and healthcare sectors leading the growth. Consumer confidence is gradually improving as employment rates stabilize and business investments increase. Central banks worldwide are implementing strategic monetary policies to support sustainable economic growth. The recovery is being driven by increased digital transformation, e-commerce expansion, and innovative business models that adapt to changing market conditions.',
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
        content: 'Technology is playing a crucial role in preserving cultural heritage for future generations. Advanced 3D scanning and digital archiving techniques are being used to create detailed records of historical artifacts and monuments. Virtual reality experiences allow people to explore ancient sites and museums from anywhere in the world. Digital libraries are making rare manuscripts and documents accessible to researchers globally. These technological innovations ensure that cultural treasures are preserved even when physical artifacts face threats from natural disasters, aging, or conflict.',
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
        content: 'Social media has fundamentally transformed how people communicate, share information, and build relationships in modern society. Platforms like Facebook, Instagram, and Twitter have created new forms of social interaction and community building. While social media connects people across geographical boundaries, it also raises concerns about privacy, misinformation, and mental health impacts. The influence of social media on political discourse, business marketing, and cultural trends continues to grow. Understanding these effects is crucial for navigating the digital age responsibly.',
        image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        level: 'Beginner',
        readingTime: 4,
        source: 'MarLang News'
      },
      {
        id: 'article-6',
        title: 'Machine Learning Advances in Medical Diagnosis',
        category: 'Technology',
        summary: 'New AI algorithms show unprecedented accuracy in medical imaging analysis.',
        content: 'Machine learning is revolutionizing medical diagnosis with remarkable advances in imaging analysis and pattern recognition. Deep learning algorithms can now detect cancerous tumors, identify neurological conditions, and diagnose eye diseases with accuracy that matches or exceeds human specialists. These AI systems are trained on millions of medical images, enabling them to recognize subtle patterns that might be missed by the human eye. The implementation of machine learning in hospitals is improving diagnostic speed, reducing human error, and making specialized medical expertise more accessible in remote areas.',
        image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
        level: 'Advanced',
        readingTime: 7,
        source: 'Tech Today'
      },
      {
        id: 'article-7',
        title: 'Renewable Energy Innovation Accelerates',
        category: 'Science',
        summary: 'Solar and wind technologies reach new efficiency milestones worldwide.',
        content: 'Renewable energy technologies are experiencing unprecedented innovation and growth worldwide. Solar panel efficiency has reached new heights with advanced photovoltaic cells, while wind turbines are becoming larger and more powerful. Battery storage solutions are solving the intermittency challenges of renewable energy, making clean power more reliable. Government incentives and falling costs are driving rapid adoption of renewable energy systems. These advances are creating new jobs, reducing carbon emissions, and providing energy independence for many communities.',
        image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
        level: 'Intermediate',
        readingTime: 5,
        source: 'Energy Weekly'
      },
      {
        id: 'article-8',
        title: 'Digital Marketing Trends Reshape Business',
        category: 'Business',
        summary: 'Companies adapt to new consumer behaviors in the digital marketplace.',
        content: 'Digital marketing is rapidly evolving as companies adapt to changing consumer behaviors and new technologies. Social media advertising, influencer partnerships, and personalized email campaigns are becoming essential tools for reaching target audiences. Data analytics helps businesses understand customer preferences and optimize their marketing strategies. Mobile-first approaches and video content are gaining prominence as consumers spend more time on smartphones and tablets. The integration of artificial intelligence in marketing automation is enabling more personalized and effective customer experiences.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        level: 'Beginner',
        readingTime: 4,
        source: 'Business Insights'
      },
      {
        id: 'article-9',
        title: 'Cybersecurity Trends in Remote Work Era',
        category: 'Technology',
        summary: 'New security challenges emerge as remote work becomes the norm.',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
        level: 'Advanced',
        readingTime: 6,
        source: 'Security Today'
      },
      {
        id: 'article-10',
        title: 'Space Exploration Mission Updates',
        category: 'Science',
        summary: 'Latest developments in international space exploration missions.',
        image: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=800&q=80',
        level: 'Intermediate',
        readingTime: 5,
        source: 'Space News'
      },
      {
        id: 'article-11',
        title: 'Modern Art Movements and Digital Media',
        category: 'Culture',
        summary: 'How digital technology is transforming contemporary art creation and exhibition.',
        image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=800&q=80',
        level: 'Beginner',
        readingTime: 4,
        source: 'Art Weekly'
      },
      {
        id: 'article-12',
        title: 'Social Justice Movements in Digital Age',
        category: 'Society',
        summary: 'Digital platforms reshape how social movements organize and communicate.',
        image: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=800&q=80',
        level: 'Advanced',
        readingTime: 7,
        source: 'Society Today'
      }
    ];

    // Generate 50 articles with random dates over the last 30 days
    const articles = [];
    for (let i = 0; i < 50; i++) {
      const baseArticle = baseArticles[i % baseArticles.length];
      const daysAgo = Math.floor(Math.random() * 30); // 0-29 days ago
      const hoursAgo = Math.floor(Math.random() * 24); // 0-23 hours ago
      const minutesAgo = Math.floor(Math.random() * 60); // 0-59 minutes ago
      const publishedAt = new Date(
        Date.now() - 
        (daysAgo * 24 * 60 * 60 * 1000) - 
        (hoursAgo * 60 * 60 * 1000) - 
        (minutesAgo * 60 * 1000)
      );

      articles.push({
        ...baseArticle,
        id: `article-${i + 1}`,
        title: i === 0 ? baseArticle.title : `${baseArticle.title} ${i + 1}`,
        publishedAt: publishedAt.toISOString(),
        likes: Math.floor(Math.random() * 500) + 50,
        views: Math.floor(Math.random() * 2000) + 100,
        content: baseArticle.content || 'This is sample content for the article. It provides detailed information about the topic and helps readers understand the subject matter better. The content is designed to be informative and engaging for English language learners.',
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

  // Get popular articles (sorted by likes, last 7 days)
  const getPopularArticles = (limit = 10) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return allArticles
      .filter(article => new Date(article.publishedAt) >= weekAgo)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);
  };

  // Get articles grouped by date
  const getArticlesByDate = () => {
    const grouped = {};
    allArticles.forEach(article => {
      const date = new Date(article.publishedAt);
      const dateStr = date.toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(article);
    });
    return grouped;
  };

  // Get articles for a specific date
  const getArticlesForDate = (dateString) => {
    return allArticles.filter(article => {
      const articleDate = new Date(article.publishedAt).toISOString().split('T')[0];
      return articleDate === dateString;
    });
  };

  // Add new article (for future use)
  const addArticle = (newArticle) => {
    const articleWithId = {
      ...newArticle,
      id: `article-${Date.now()}`,
      publishedAt: new Date().toISOString(),
      likes: 0
    };
    setAllArticles(prev => [articleWithId, ...prev]);
    setLastUpdated(new Date().toISOString());
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

  // Get all unique categories from articles
  const getAllCategories = () => {
    const uniqueCategories = [...new Set(allArticles.map(article => article.category))];
    return uniqueCategories.filter(Boolean).sort();
  };

  // Get dynamic category list for Home page with order respect
  const getHomepageCategories = () => {
    const dynamicCategories = getAllCategories();
    
    // 대시보드에서 저장된 카테고리 순서 가져오기
    const savedOrder = localStorage.getItem('marlang_category_order');
    let orderedCategories = dynamicCategories;
    
    if (savedOrder) {
      try {
        const categoryOrder = JSON.parse(savedOrder);
        const ordered = [];
        const unordered = [...dynamicCategories];
        
        // 저장된 순서대로 추가
        categoryOrder.forEach(catName => {
          const index = unordered.indexOf(catName);
          if (index !== -1) {
            ordered.push(catName);
            unordered.splice(index, 1);
          }
        });
        
        // 남은 카테고리 추가
        orderedCategories = [...ordered, ...unordered];
      } catch (error) {
        console.warn('Failed to parse category order:', error);
      }
    }
    
    // 기본 카테고리 (Recent) + 정렬된 동적 카테고리 + Popular
    const categories = [
      { id: 'recent', name: 'Recent', type: 'recent' },
      ...orderedCategories.map(cat => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'),
        name: cat,
        type: 'category'
      })),
      { id: 'popular', name: 'Popular', type: 'popular' }
    ];
    
    return categories;
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
    getArticlesByDate,
    getArticlesForDate,
    addArticle,
    refreshArticles,
    getAllCategories,
    getHomepageCategories
  };

  return (
    <ArticlesContext.Provider value={value}>
      {children}
    </ArticlesContext.Provider>
  );
};