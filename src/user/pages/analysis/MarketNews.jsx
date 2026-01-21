import { useState, useRef } from 'react'
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function MarketNews() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState(0)
  const hotNewsRef = useRef(null)
  const analysisRef = useRef(null)

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
      logo: 'a AMZN',
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
  ]

  const analysisCards = [
    {
      id: 1,
      ticker: 'ETH',
      name: 'Ethereum',
      movement: 'MOVING DOWN',
      change: '-3.7%',
      changeColor: 'red',
      logo: 'ETH',
      description: 'Ethereum drops below $3,000 amid market volatility. Retail selling of Bitcoin and ETH ETFs fuels correction, while BlackRock\'s ETH transfer',
      type: 'trade',
      status: 'Sell Limit',
      statusColor: 'red',
      target: '2560.00'
    },
    {
      id: 2,
      ticker: 'NVDA',
      name: 'NVIDIA',
      movement: 'MOVING DOWN',
      change: '-1.05%',
      changeColor: 'red',
      logo: 'NVDA',
      description: 'NVIDIA shares drop amid sector-wide decline. Concerns grow over revenue sustainability and inventory levels after strong jobs report.',
      type: 'performance',
      vsSector: 'BOTTOM 33%',
      vsSectorColor: 'red',
      vsSP500: 'BOTTOM 12%',
      vsSP500Color: 'red'
    },
    {
      id: 3,
      ticker: 'ROST',
      name: 'Ross Stores',
      movement: 'MOVING UP',
      change: '+7.44%',
      changeColor: 'green',
      logo: 'ROST',
      description: 'Ross Stores beats earnings expectations with $511.94M net income. Full-year EPS forecast raised, driving strong market activity today.',
      type: 'trade',
      status: 'Live Trade',
      statusColor: 'green',
      target: '175.02',
      readMore: true
    },
    {
      id: 4,
      ticker: 'META',
      name: 'Meta Platforms',
      movement: 'MOVING DOWN',
      change: '-0.25%',
      changeColor: 'red',
      logo: 'META',
      description: 'Meta is venturing into electricity trading for AI growth. A Spanish court ruling requires Meta to pay EUR 479 million for unfair competition.',
      type: 'performance',
      vsSector: 'BOTTOM 4%',
      vsSectorColor: 'red',
      vsSP500: 'BOTTOM 20%',
      vsSP500Color: 'red'
    },
    {
      id: 5,
      ticker: 'AMD',
      name: 'Advanced Micro Devices',
      movement: 'MOVING DOWN',
      change: '-2.8%',
      changeColor: 'red',
      logo: 'AMD',
      description: 'AMD stock declines amid negative AI CPU benchmark. U.S. Department of Energy partnership fails to boost sentiment.',
      type: 'performance',
      vsSector: 'BOTTOM 15%',
      vsSectorColor: 'red',
      vsSP500: 'BOTTOM 8%',
      vsSP500Color: 'red',
      readMore: true
    }
  ]

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
  ]

  const nextNews = () => {
    setCurrentNewsIndex((prev) => (prev + 1) % marketNews.length)
  }

  const prevNews = () => {
    setCurrentNewsIndex((prev) => (prev - 1 + marketNews.length) % marketNews.length)
  }

  const nextAnalysis = () => {
    setCurrentAnalysisIndex((prev) => (prev + 1) % analysisCards.length)
  }

  const prevAnalysis = () => {
    setCurrentAnalysisIndex((prev) => (prev - 1 + analysisCards.length) % analysisCards.length)
  }

  const scrollHotNewsLeft = () => {
    if (hotNewsRef.current) {
      hotNewsRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollHotNewsRight = () => {
    if (hotNewsRef.current) {
      hotNewsRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const scrollAnalysisLeft = () => {
    if (analysisRef.current) {
      analysisRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollAnalysisRight = () => {
    if (analysisRef.current) {
      analysisRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

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
  }

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.raw.name}: (${context.parsed.x.toFixed(1)}, ${context.parsed.y.toFixed(1)})`
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
        },
        min: 0,
        max: 10,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'News Volume',
        },
        min: 0,
        max: 10,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        },
      },
    },
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-[95%] mx-auto">
        <h1 className="mb-6" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '400' }}>
          Market News
        </h1>

        {/* Market News Carousel */}
        <div className="mb-8">
          {/* <h2 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '400' }}>
            Market News
          </h2> */}
          <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '700' }}>
              Hot News
            </h2>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative">
            <div ref={hotNewsRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
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
                  className="min-w-[240px] rounded-lg p-3 pb-8 border border-gray-200 shadow-md relative overflow-hidden"
                  style={{
                    backgroundImage: `url('${news.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-60"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-600">{news.date}</span>
                      <span className="text-[#00A896] font-semibold">{news.type}</span>
                    </div>

                    {/* New badge with line */}
                    <div className="w-full flex items-center justify-center mb-5 relative">
                      <div className="absolute w-full h-[1px] bg-gray-300"></div>
                      <span className="relative bg-[#00A896] text-white text-xs px-3 py-1 rounded-full z-10 shadow">
                        New
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-base font-semibold text-black leading-snug pt-14  text-center">
                      {news.headline.split(' ').slice(0, 4).join(' ')} <br />
                      {news.headline.split(' ').slice(4, 8).join(' ')} <br />
                      {news.headline.split(' ').slice(8).join(' ')}
                    </p>

                    {/* Pair Badge */}
                    <div className="text-center">
                      <div className="inline-block bg-white px-3 py-1 rounded-full border border-gray-300 text-xs font-medium text-gray-700 shadow-sm mt-2">
                        {news.pair}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={scrollHotNewsLeft} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={scrollHotNewsRight} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        </div>

        {/* Trending Instruments Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '20px', color: '#000000', fontWeight: '600' }}>
              Trending Instruments
            </h2>
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Most Newsworthy Instruments - Scatter Plot */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md">
              <h3 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#000000', fontWeight: '600' }}>
                Most Newsworthy Instruments
              </h3>
              <div className="h-80">
                <Scatter data={scatterData} options={scatterOptions} />
              </div>
            </div>

            {/* News & Insights */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-md max-h-[400px] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#000000', fontWeight: '600' }}>
                  News & Insights
                </h3>
                <span className="px-2 py-1 bg-gray-200 rounded-full text-xs" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                  EURJPY
                </span>
              </div>

              <div className="space-y-4">
                {newsInsights.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                        {item.date}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '600' }}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-[30%]">
                        <img src={item.imageUrl} alt={item.image} className="w-full h-24 md:h-36 object-cover rounded" />
                      </div>
                      <div className="w-full md:w-[70%]">
                        <h4 className="font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#000000', fontWeight: '600' }}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: '400', lineHeight: '1.5' }}>
                          {item.description}
                        </p>
                        {item.tags && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.partialText && (
                          <p className="text-xs text-gray-500 italic" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                            {item.partialText}...
                          </p>
                        )}
                        <button className="mt-2 px-4 py-2 bg-gray-800 text-white text-xs font-semibold rounded hover:bg-gray-900 transition-colors" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '600' }}>
                          FIND OUT MORE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '700' }}>
              Analysis
            </h2>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative">
            <div ref={analysisRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {[
                {
                  id: 1,
                  date: '21/11/2025 20:59',
                  type: 'SUMMARY',
                  image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=60',
                  headline: 'Energy Markets React to Breakthrough Peace Deal Between U.S., Russia, and Ukraine',
                  pair: 'EURUSD'
                },
                {
                  id: 2,
                  date: '21/11/2025 20:58',
                  type: 'SNAPSHOTS',
                  image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=60',
                  headline: 'Currency pairs: Latest news',
                  pair: 'EURUSD'
                },
                {
                  id: 3,
                  date: '21/11/2025 19:22',
                  type: 'SUMMARY',
                  image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=800&q=60',
                  headline: 'Charting the Future: Vice Chair Jefferson Speaks on AI and Financial Stability',
                  pair: 'EURUSD'
                },
                {
                  id: 4,
                  date: '21/11/2025 19:22',
                  type: 'SNAPSHOTS',
                  image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=60',
                  headline: 'Currency pairs: Latest news',
                  pair: 'USDCAD'
                },
                {
                  id: 5,
                  date: '21/11/2025 19:07',
                  type: 'SUMMARY',
                  image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=60',
                  headline: 'Federal Reserve Welcomes Young M at the 2025 National College Fed Challenge Finals',
                  pair: 'EURUSD'
                }
              ].map((news) => (
                <div
                  key={news.id}
                  className="min-w-[240px] rounded-lg p-3 pb-8 border border-gray-200 shadow-md relative overflow-hidden"
                  style={{
                    backgroundImage: `url('${news.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-60"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-gray-600">{news.date}</span>
                      <span className="text-[#00A896] font-semibold">{news.type}</span>
                    </div>

                    {/* New badge with line */}
                    <div className="w-full flex items-center justify-center mb-5 relative">
                      <div className="absolute w-full h-[1px] bg-gray-300"></div>
                      <span className="relative bg-[#00A896] text-white text-xs px-3 py-1 rounded-full z-10 shadow">
                        New
                      </span>
                    </div>

                    {/* Title */}
                    <p className="text-base font-semibold text-black leading-snug pt-14  text-center">
                      {news.headline.split(' ').slice(0, 4).join(' ')} <br />
                      {news.headline.split(' ').slice(4, 8).join(' ')} <br />
                      {news.headline.split(' ').slice(8).join(' ')}
                    </p>

                    {/* Pair Badge */}
                    <div className="text-center">
                      <div className="inline-block bg-white px-3 py-1 rounded-full border border-gray-300 text-xs font-medium text-gray-700 shadow-sm mt-2">
                        {news.pair}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={scrollAnalysisLeft} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={scrollAnalysisRight} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketNews

