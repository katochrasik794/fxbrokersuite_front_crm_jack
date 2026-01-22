import React, { useState, useRef } from 'react';
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Clock,
  Tag,
  BarChart2,
  ExternalLink
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function MarketNews() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0);
  const hotNewsRef = useRef(null);
  const analysisRef = useRef(null);

  const marketNews = [
    {
      id: 1,
      ticker: 'AVGO',
      name: 'Broadcom',
      movement: 'MOVING DOWN',
      change: '-2.47%',
      changeColor: 'red',
      logo: 'AVGO',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=60',
      description: 'Broadcom resumes Outperform rating at $420 target. High trading volume amid broader semiconductor sector decline.',
      type: 'performance',
      vsSector: 'BOTTOM 9%',
      vsSectorColor: 'red',
      vsSP500: 'BOTTOM 3%',
      vsSP500Color: 'red'
    },
    {
      id: 2,
      ticker: 'TSLA',
      name: 'Tesla',
      movement: 'MOVING DOWN',
      change: '-0.9%',
      changeColor: 'red',
      logo: 'TSLA',
      image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=60',
      description: 'Tesla faces concerns over its 4% NEV market share in China. Market cap loss parallels Kia\'s value amid innovation criticism.',
      type: 'performance',
      vsSector: 'BOTTOM 7%',
      vsSectorColor: 'red',
      vsSP500: 'BOTTOM 18%',
      vsSP500Color: 'red'
    },
    {
      id: 3,
      ticker: 'AMZN',
      name: 'Amazon',
      movement: 'MOVING UP',
      change: '+0.66%',
      changeColor: 'green',
      logo: 'AMZN',
      image: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&w=800&q=60',
      description: 'Amazon rises amid mixed economic signals and strong services demand. CEO Jassy plans to sell shares as layoffs impact engineering roles.',
      type: 'trade',
      status: 'Sell Limit',
      statusColor: 'red',
      target: '171.18'
    },
    {
      id: 4,
      ticker: 'MSFT',
      name: 'Microsoft',
      movement: 'MOVING DOWN',
      change: '-1.52%',
      changeColor: 'red',
      logo: 'MSFT',
      image: 'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=800&q=60',
      description: 'Microsoft faces scrutiny over gaming and competition. Social media buzzes about new NVIDIA deployments and AI supercomputer plans.',
      type: 'performance',
      vsSector: 'TOP 17%',
      vsSectorColor: 'green',
      vsSP500: 'BOTTOM 1%',
      vsSP500Color: 'red'
    },
    {
      id: 5,
      ticker: 'EURUSD',
      name: 'Energy Markets',
      date: '21/11/2025 20:59',
      summary: 'SUMMARY',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=60',
      description: 'Energy Markets React to Breakthrough Peace Deal Between U.S., Russia, and Ukraine',
      tag: 'EURUSD'
    }
  ];

  const newsInsights = [
    {
      id: 1,
      date: '21/11/2025 21:35',
      category: 'MARKET INSIGHT',
      image: 'EURJPY',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=60',
      title: 'EUR/JPY declines amid broader market sentiment',
      description: 'EUR/JPY declines amid broader market sentiment. USD/JPY\'s drop influences EUR/JPY\'s trajectory, reflecting similar downward trends. The EUR/JPY currency pair has declined by 0.8% since the previous close. This movement coincides with a 0.54%',
      tag: 'EURJPY'
    },
    {
      id: 2,
      date: '21/11/2025 20:04',
      category: 'MACRO PREVIEW',
      image: 'Japan',
      imageUrl: '/japan.jpg',
      title: 'Japan\'s Manufacturing PMI Flash Shows Slight Improvement',
      description: 'Japan\'s Manufacturing PMI Flash Shows Slight Improvement at 48.8, Yet Signals Continued Contraction Amidst Economic Concerns and Market Volatility',
      tags: ['Economic Indicators', 'Market Sentiment', 'Sector Weakness'],
      partialText: 'At 00:30 UTC on November 21, 2025, the Jibun Bank'
    },
    {
      id: 3,
      date: '21/11/2025 19:45',
      category: 'ECONOMIC INDICATORS',
      image: 'US',
      imageUrl: '/flag-icon.svg',
      title: 'US Economic Data Release: Inflation Figures Beat Expectations',
      description: 'US CPI data shows inflation cooling faster than anticipated, boosting market optimism. Federal Reserve hints at potential rate cuts in upcoming meetings.',
      tags: ['Inflation', 'Fed Policy', 'Economic Data'],
      partialText: 'The latest Consumer Price Index (CPI) report revealed...'
    },
    {
      id: 4,
      date: '21/11/2025 18:30',
      category: 'CRYPTO NEWS',
      image: 'BTC',
      imageUrl: '/bitcoin-logo.webp',
      title: 'Bitcoin Surges Past $100,000 Amid Institutional Adoption',
      description: 'Bitcoin hits new all-time high as major corporations announce BTC holdings. Regulatory clarity in the US drives increased institutional interest.',
      tags: ['Cryptocurrency', 'Institutional Investment', 'Regulation'],
      partialText: 'Following the announcement by Tesla and MicroStrategy...'
    },
    {
      id: 5,
      date: '21/11/2025 17:15',
      category: 'COMMODITIES UPDATE',
      image: 'Gold',
      imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=800&q=60',
      title: 'Gold Prices Rally on Geopolitical Tensions',
      description: 'Gold futures climb as escalating tensions in the Middle East fuel safe-haven demand. Analysts predict further upside if conflicts intensify.',
      tags: ['Gold', 'Geopolitical Risk', 'Safe Haven'],
      partialText: 'Spot gold prices have risen approximately 2.5%...'
    }
  ];

  const scrollHotNewsLeft = () => {
    if (hotNewsRef.current) {
      hotNewsRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollHotNewsRight = () => {
    if (hotNewsRef.current) {
      hotNewsRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Scatter plot data for trending instruments
  const scatterData = {
    datasets: [
      {
        label: 'Best Performers',
        data: [
          { x: 8.5, y: 9.2, name: 'AAPL' },
          { x: 9.1, y: 8.8, name: 'MSFT' },
          { x: 8.8, y: 9.5, name: 'GOOGL' },
        ],
        backgroundColor: '#10b981',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Growth Potential',
        data: [
          { x: 7.2, y: 6.8, name: 'TSLA' },
          { x: 6.9, y: 7.5, name: 'NVDA' },
          { x: 7.8, y: 6.2, name: 'AMD' },
        ],
        backgroundColor: '#3b82f6',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Warning Signs',
        data: [
          { x: 2.1, y: 8.9, name: 'META' },
          { x: 1.8, y: 9.1, name: 'NFLX' },
          { x: 2.5, y: 8.7, name: 'AMZN' },
        ],
        backgroundColor: '#f59e0b',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
      {
        label: 'Worst Performers',
        data: [
          { x: 1.2, y: 1.5, name: 'AVGO' },
          { x: 0.8, y: 2.1, name: 'INTC' },
          { x: 1.5, y: 1.8, name: 'ORCL' },
        ],
        backgroundColor: '#ef4444',
        pointRadius: 8,
        pointHoverRadius: 10,
      },
    ],
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: "'Inter', sans-serif",
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12
        },
        callbacks: {
          label: function(context) {
            return `${context.raw.name}: (${context.parsed.x.toFixed(1)}, ${context.parsed.y.toFixed(1)})`;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Market Sentiment',
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 500
          },
          color: '#64748b'
        },
        min: 0,
        max: 10,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: '#94a3b8'
        }
      },
      y: {
        title: {
          display: true,
          text: 'News Volume',
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 500
          },
          color: '#64748b'
        },
        min: 0,
        max: 10,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          color: '#94a3b8'
        }
      },
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Market News" 
        subtitle="Stay updated with the latest market trends and breaking news"
        icon={Newspaper}
      />

      {/* Hot News Section */}
      <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Hot News
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={scrollHotNewsLeft} 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={scrollHotNewsRight} 
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            ref={hotNewsRef} 
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              {
                id: 1,
                date: '21/11/2025 20:59',
                type: 'TECHNICAL ANALYSIS',
                image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=60',
                headline: 'EUR/USD Technical Analysis: Bullish Momentum Building',
                pair: 'EURUSD'
              },
              {
                id: 2,
                date: '21/11/2025 20:58',
                type: 'FUNDAMENTAL ANALYSIS',
                image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=60',
                headline: 'Oil Markets Fundamental Outlook: Supply Chain Disruptions',
                pair: 'WTI'
              },
              {
                id: 3,
                date: '21/11/2025 19:22',
                type: 'SENTIMENT ANALYSIS',
                image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=60',
                headline: 'Market Sentiment Analysis: Risk Appetite Rising',
                pair: 'SP500'
              },
              {
                id: 4,
                date: '21/11/2025 19:22',
                type: 'QUANTITATIVE ANALYSIS',
                image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=60',
                headline: 'Quantitative Analysis: Algorithmic Trading Trends',
                pair: 'NASDAQ'
              },
              {
                id: 5,
                date: '21/11/2025 19:07',
                type: 'MACRO ANALYSIS',
                image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=60',
                headline: 'Macro Analysis: Global Economic Indicators Review',
                pair: 'GDP'
              }
            ].map((news) => (
              <div
                key={news.id}
                className="min-w-[300px] md:min-w-[340px] snap-center rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 relative group cursor-pointer"
                style={{ height: '240px' }}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url('${news.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
                
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      New
                    </span>
                    <span className="bg-slate-900/60 backdrop-blur-sm text-slate-200 text-xs px-2.5 py-1 rounded-lg border border-white/10">
                      {news.pair}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2 text-xs font-medium text-blue-300">
                      <Clock className="w-3.5 h-3.5" />
                      {news.date.split(' ')[1]} UTC
                    </div>
                    <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 mb-2">
                      {news.headline}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-300 text-xs font-medium uppercase tracking-wider">
                      <Tag className="w-3.5 h-3.5" />
                      {news.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending Instruments Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Scatter Plot Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  Most Newsworthy Instruments
                </h3>
                <p className="text-slate-500 text-sm mt-1">Correlation between market sentiment and news volume</p>
              </div>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                View Full Report <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="h-[400px] w-full">
              <Scatter data={scatterData} options={scatterOptions} />
            </div>
          </div>

          {/* News Feed */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Latest Insights</h3>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                Live Feed
              </span>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {newsInsights.map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="flex gap-4">
                    <div className="relative shrink-0">
                      {item.imageUrl && !item.imageUrl.includes('.svg') ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-16 h-16 rounded-xl object-cover shadow-sm group-hover:shadow transition-all"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Newspaper className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.date.split(' ')[1]}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 border-b border-slate-50 group-last:border-0" />
                </div>
              ))}
            </div>
            
            <button className="w-full mt-4 py-3 bg-slate-50 text-slate-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm">
              Load More News <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

    </div>
  );
}

export default MarketNews;
