import { useState, useRef } from 'react'
import { 
  Filter, 
  Info, 
  TrendingUp, 
  Newspaper, 
  Calendar, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight,
  BarChart2,
  Globe,
  DollarSign,
  Activity,
  Clock,
  Tag,
  X
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'

function ResearchTerminal() {
  const [selectedAssetType, setSelectedAssetType] = useState('all')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false)
  
  const hotNewsRef = useRef(null)
  const marketCompanionRef = useRef(null)
  const calendarEventsRef = useRef(null)
  const analysisIQRef = useRef(null)

  const hotTradeIdeas = [
    {
      id: 1,
      asset: 'BRENT',
      assetIcon: '🛢️',
      direction: 'Sell',
      directionColor: 'red',
      period: 'Intraday',
      stop: '64.940',
      entry: '64.150',
      target: '61.900',
      confidence: 4,
      status: 'Sell Limit',
      statusColor: 'red',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 13:36',
      chartDirection: 'down'
    },
    {
      id: 2,
      asset: 'XAG/USD',
      assetIcon: 'Ag',
      direction: 'Buy',
      directionColor: 'green',
      period: 'Intraday',
      stop: '46.11',
      entry: '47.40',
      target: '51.10',
      confidence: 4,
      status: 'Buy Limit',
      statusColor: 'green',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 13:27',
      chartDirection: 'up'
    },
    {
      id: 3,
      asset: 'XAU/USD',
      assetIcon: 'Au',
      direction: 'Buy',
      directionColor: 'green',
      period: 'Intraday',
      stop: '3955.00',
      entry: '4005.00',
      target: '4194.00',
      confidence: 4,
      status: 'Buy Limit',
      statusColor: 'green',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 12:04',
      chartDirection: 'up'
    }
  ]

  const mostPopular = [
    {
      id: 1,
      asset: 'EUR/USD',
      assetIcon: '🇪🇺🇺🇸',
      timestamp: '08/11 21/11/2025 06:35'
    },
    {
      id: 2,
      asset: 'XRP',
      assetIcon: '💎',
      timestamp: '08/11 21/11/2025 06:35'
    }
  ]

  const assetsToWatch = [
    {
      id: 1,
      asset: 'USOIL',
      icon: '🛢️',
      price: '$57.940',
      opportunity: 'Bearish',
      opportunityColor: 'red',
      opportunityBar: { red: 85, orange: 10, green: 5 },
      priceTrend: 'Very Bearish',
      priceTrendValue: -100,
      priceTrendColor: 'red',
      newsSentiment: 'Bearish',
      newsSentimentValue: -26,
      newsSentimentColor: 'red',
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Below Average',
      newsVolumePosition: 'left',
      change1D: '-1.93%',
      changeColor: 'red'
    },
    {
      id: 2,
      asset: 'DE40',
      icon: '🇩🇪',
      price: '€23218',
      opportunity: 'Very Bullish',
      opportunityColor: 'green',
      opportunityBar: { red: 5, orange: 10, green: 85 },
      priceTrend: 'Very Bullish',
      priceTrendValue: 100,
      priceTrendColor: 'green',
      newsSentiment: 'Bearish',
      newsSentimentValue: -9,
      newsSentimentColor: 'red',
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Below Average',
      newsVolumePosition: 'left',
      change1D: '+0.37%',
      changeColor: 'green'
    },
    {
      id: 3,
      asset: 'US30',
      icon: '🇺🇸',
      price: '$46410',
      opportunity: 'Bullish',
      opportunityColor: 'green',
      opportunityBar: { red: 20, orange: 20, green: 60 },
      priceTrend: 'Very Bullish',
      priceTrendValue: 90,
      priceTrendColor: 'green',
      newsSentiment: 'Bearish',
      newsSentimentValue: -23,
      newsSentimentColor: 'red',
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Above Average',
      newsVolumePosition: 'right',
      change1D: '+0.79%',
      changeColor: 'green'
    },
    {
      id: 4,
      asset: 'US500',
      icon: '🇺🇸',
      price: '$6623',
      opportunity: 'Bullish',
      opportunityColor: 'green',
      opportunityBar: { red: 20, orange: 20, green: 60 },
      priceTrend: 'Very Bullish',
      priceTrendValue: 90,
      priceTrendColor: 'green',
      newsSentiment: 'Bearish',
      newsSentimentValue: -9,
      newsSentimentColor: 'red',
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Above Average',
      newsVolumePosition: 'right',
      change1D: '+0.02%',
      changeColor: 'green'
    },
    {
      id: 5,
      asset: 'US100',
      icon: '🇺🇸',
      price: '$24308',
      opportunity: 'Bullish',
      opportunityColor: 'green',
      opportunityBar: { red: 20, orange: 20, green: 60 },
      priceTrend: 'Very Bullish',
      priceTrendValue: 90,
      priceTrendColor: 'green',
      newsSentiment: 'Bearish',
      newsSentimentValue: -24,
      newsSentimentColor: 'red',
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Above Average',
      newsVolumePosition: 'right',
      change1D: '-0.74%',
      changeColor: 'red'
    },
    {
      id: 6,
      asset: 'APPL',
      icon: '🍎',
      price: '$270.26',
      opportunity: 'Bullish',
      opportunityColor: 'green',
      opportunityBar: { red: 20, orange: 20, green: 60 },
      priceTrend: 'Very Bullish',
      priceTrendValue: 80,
      priceTrendColor: 'green',
      newsSentiment: 'Bullish',
      newsSentimentValue: 11,
      newsSentimentColor: 'green',
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Below Average',
      newsVolumePosition: 'left',
      change1D: '-0.19%',
      changeColor: 'red'
    }
  ]

  const hotNews = [
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
  ]

  const marketCompanion = [
    {
      id: 1,
      date: '26/11/2025 10:32',
      type: 'MACRO PREVIEW',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=60',
      country: 'DE',
      flag: 'https://flagcdn.com/w20/de.png',
      title: 'German Consumer Confidence Expected to Decline Amid Weakened Business Sentiment and Economic Concerns',
      impact: 'High',
      eventDate: '27 Nov 2025, 12:30'
    },
    {
      id: 2,
      date: '26/11/2025 11:15',
      type: 'MACRO PREVIEW',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=60',
      country: 'US',
      flag: 'https://flagcdn.com/w20/us.png',
      title: 'US Federal Reserve Meeting to Discuss Interest Rate Policy and Economic Outlook',
      impact: 'High',
      eventDate: '28 Nov 2025, 14:00',
      change: '0.76%',
      direction: 'up'
    },
    {
      id: 3,
      date: '26/11/2025 12:45',
      type: 'MACRO PREVIEW',
      image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=60',
      country: 'UK',
      flag: 'https://flagcdn.com/w20/gb.png',
      title: 'Bank of England Monetary Policy Statement and Interest Rate Decision',
      impact: 'Medium',
      eventDate: '29 Nov 2025, 11:00',
      change: '-0.23%',
      direction: 'down'
    },
    {
      id: 4,
      date: '26/11/2025 13:20',
      type: 'MACRO PREVIEW',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=60',
      country: 'JP',
      flag: 'https://flagcdn.com/w20/jp.png',
      title: 'Bank of Japan Policy Meeting and Economic Assessment',
      impact: 'High',
      eventDate: '30 Nov 2025, 09:00',
      change: '1.15%',
      direction: 'up'
    },
    {
      id: 5,
      date: '26/11/2025 14:10',
      type: 'MACRO PREVIEW',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=60',
      country: 'EU',
      flag: 'https://flagcdn.com/w20/eu.png',
      title: 'European Central Bank Press Conference and Economic Projections',
      impact: 'High',
      eventDate: '01 Dec 2025, 13:45',
      change: '-0.45%',
      direction: 'down'
    },
    {
      id: 6,
      date: '26/11/2025 15:05',
      type: 'MACRO PREVIEW',
      image: 'https://images.unsplash.com/photo-1493655161922-ef98929de9d8?auto=format&fit=crop&w=600&q=60',
      country: 'CN',
      flag: 'https://flagcdn.com/w20/cn.png',
      title: 'China Central Bank Interest Rate Decision and Monetary Policy Update',
      impact: 'Medium',
      eventDate: '02 Dec 2025, 10:30',
      change: '0.92%',
      direction: 'up'
    }
  ]

  const calendarEvents = [
    {
      id: 1,
      type: 'Dividends',
      ticker: 'CFI.XX',
      title: 'CF Industries Holdings Inc',
      subtitle: '28.11 NA',
      description: 'Quarterly 2025 Dividend Payment Date',
      amount: '$0.5'
    },
    {
      id: 2,
      type: 'Dividends',
      ticker: 'AAPL.XX',
      title: 'Apple Inc',
      subtitle: '29.11 NA',
      description: 'Quarterly 2025 Dividend Payment Date',
      amount: '$0.25'
    },
    {
      id: 3,
      type: 'Dividends',
      ticker: 'MSFT.XX',
      title: 'Microsoft Corporation',
      subtitle: '30.11 NA',
      description: 'Quarterly 2025 Dividend Payment Date',
      amount: '$0.75'
    },
    {
      id: 4,
      type: 'Dividends',
      ticker: 'JNJ.XX',
      title: 'Johnson & Johnson',
      subtitle: '01.12 NA',
      description: 'Quarterly 2025 Dividend Payment Date',
      amount: '$1.2'
    },
    {
      id: 5,
      type: 'Dividends',
      ticker: 'KO.XX',
      title: 'Coca-Cola Company',
      subtitle: '02.12 NA',
      description: 'Quarterly 2025 Dividend Payment Date',
      amount: '$0.46'
    }
  ]

  const analysisIQ = [
    {
      id: 1,
      asset: 'EUR/USD',
      assetIcon: '🇪🇺🇺🇸',
      direction: 'Buy',
      directionColor: 'green',
      period: 'Intraday',
      stop: '1.0820',
      entry: '1.0850',
      target: '1.0920',
      confidence: 4,
      status: 'Buy Limit',
      statusColor: 'green',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 14:30'
    },
    {
      id: 2,
      asset: 'XAU/USD',
      assetIcon: 'Au',
      direction: 'Buy',
      directionColor: 'green',
      period: 'Intraday',
      stop: '1950.00',
      entry: '1980.00',
      target: '2050.00',
      confidence: 3,
      status: 'Buy Limit',
      statusColor: 'green',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 13:45'
    },
    {
      id: 3,
      asset: 'BTC/USD',
      assetIcon: '₿',
      direction: 'Buy',
      directionColor: 'green',
      period: 'Intraday',
      stop: '44000.00',
      entry: '45000.00',
      target: '48000.00',
      confidence: 5,
      status: 'Buy Limit',
      statusColor: 'green',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 12:15'
    },
    {
      id: 4,
      asset: 'USOIL',
      assetIcon: '🛢️',
      direction: 'Sell',
      directionColor: 'red',
      period: 'Intraday',
      stop: '85.00',
      entry: '82.00',
      target: '78.00',
      confidence: 4,
      status: 'Sell Limit',
      statusColor: 'red',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 11:20'
    },
    {
      id: 5,
      asset: 'BTC/USD',
      assetIcon: '₿',
      direction: 'Buy',
      directionColor: 'green',
      period: 'Intraday',
      stop: '44000.00',
      entry: '45000.00',
      target: '48000.00',
      confidence: 5,
      status: 'Buy Limit',
      statusColor: 'green',
      expiration: '22/11/25 02:30',
      timestamp: '21/11/2025 12:15'
    }
  ]

  const scrollSection = (ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Research Terminal" 
        subtitle="Advanced market analysis and trading insights"
        icon={Search}
      />

      {/* Asset Type Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['equity', 'currency', 'commodity', 'index', 'crypto'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedAssetType(type)}
            className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm font-semibold border ${
              selectedAssetType === type 
                ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {type === 'equity' && <BarChart2 className="w-4 h-4" />}
            {type === 'currency' && <DollarSign className="w-4 h-4" />}
            {type === 'commodity' && <Tag className="w-4 h-4" />}
            {type === 'index' && <Activity className="w-4 h-4" />}
            {type === 'crypto' && <Globe className="w-4 h-4" />}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        
        <div className="ml-auto">
           <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - News Article */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-4">
            <div className="text-green-600 font-bold text-sm mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              MOVING UP 2.4%
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Adobe Inc rises amid strong services demand; mixed manufacturing signals persist. Despite a 30% year-to-date decline, growth projections remain optimistic.
            </p>
            <button className="text-sm text-gray-900 hover:text-blue-600 font-medium flex items-center gap-1 mb-4 transition-colors">
              READ MORE
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-32 bg-gray-50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-gray-100">
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-2 gap-2 p-4">
                <div className="text-xs font-semibold text-gray-400">New York</div>
                <div className="text-xs font-semibold text-gray-400">Frankfurt</div>
                <div className="text-xs font-semibold text-gray-400">Singapore</div>
                <div className="text-xs font-semibold text-gray-400">API</div>
              </div>
            </div>
            <Activity className="w-8 h-8 text-gray-300" />
          </div>
          <div className="text-xs text-gray-400 font-medium tracking-wider">
            BY ACUITY
          </div>
        </div>

        {/* Middle Columns - Hot Trade Ideas */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {hotTradeIdeas.map((idea) => (
            <div key={idea.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm border border-gray-100">
                    {idea.assetIcon}
                  </div>
                  <span className="font-bold text-sm text-gray-900">
                    {idea.asset}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {idea.timestamp.split(' ')[1]}
                </div>
              </div>

              <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 font-medium">HOT TRADE IDEA</span>
                  <span className="text-xs font-bold text-gray-900">AnalysisIQ</span>
                </div>
                <div className="text-xs text-gray-400">
                  Exp: {idea.expiration.split(' ')[0]}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span className="text-gray-500 block mb-0.5">Direction</span>
                  <div className={`font-bold ${idea.directionColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                    {idea.direction}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Period</span>
                  <div className="font-bold text-gray-900">{idea.period}</div>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Stop</span>
                  <div className="font-bold text-red-600">{idea.stop}</div>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Entry</span>
                  <div className="font-bold text-blue-600">{idea.entry}</div>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Target</span>
                  <div className="font-bold text-green-600">{idea.target}</div>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">Confidence</span>
                  <div className="flex items-end gap-0.5 h-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 rounded-sm ${i < idea.confidence ? 'bg-blue-500' : 'bg-gray-200'}`}
                        style={{ height: `${(i + 1) * 20}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={`text-xs font-bold text-center py-1.5 rounded-lg ${idea.statusColor === 'red' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                Status: {idea.status}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column - Most Popular */}
        <div className="lg:col-span-1 space-y-4">
          {mostPopular.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm border border-gray-100">
                    {item.assetIcon}
                  </div>
                  <span className="font-bold text-sm text-gray-900">
                    {item.asset}
                  </span>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-900">MOST POPULAR</span>
                </div>
                <div className="text-xs text-gray-500">News Volume (30d avg)</div>
              </div>
              <div className="h-16 bg-gray-50 rounded-lg mb-2 flex items-end gap-1 p-2 border border-gray-100">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-sm opacity-80"
                    style={{ height: `${Math.random() * 70 + 20}%` }}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400 text-right">
                {item.timestamp.split(' ')[1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assets to Watch Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Assets to Watch</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsColumnsModalOpen(true)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white"
            >
              COLUMNS
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Asset', 'Price', 'Opportunity', 'Price Trend', 'News Sentiment', 'Volatility', 'News Volume', 'Change (1D)', ''].map((header, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assetsToWatch.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm border border-gray-100">
                          {asset.icon}
                        </div>
                        <span className="font-bold text-sm text-gray-900">{asset.asset}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium">{asset.price}</td>
                    <td className="px-4 py-3">
                      <div className={`text-xs font-bold mb-1 ${asset.opportunityColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                        {asset.opportunity}
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden w-24">
                        <div className="bg-red-500" style={{ width: `${asset.opportunityBar.red}%` }}></div>
                        <div className="bg-orange-500" style={{ width: `${asset.opportunityBar.orange}%` }}></div>
                        <div className="bg-green-500" style={{ width: `${asset.opportunityBar.green}%` }}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-xs font-bold ${asset.priceTrendColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                        {asset.priceTrend}
                      </div>
                      <div className="text-xs text-gray-400">{asset.priceTrendValue}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-xs font-bold ${asset.newsSentimentColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                        {asset.newsSentiment}
                      </div>
                      <div className="text-xs text-gray-400">{asset.newsSentimentValue}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 mb-1">{asset.volatility}</div>
                      <div className="relative w-24 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                            asset.volatilityPosition === 'left' ? 'w-1/3' :
                            asset.volatilityPosition === 'center' ? 'w-2/3 left-1/6' :
                            'w-2/3 right-0'
                          }`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 mb-1">{asset.newsVolume}</div>
                      <div className="relative w-24 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                            asset.newsVolumePosition === 'left' ? 'w-1/3' :
                            asset.newsVolumePosition === 'center' ? 'w-2/3 left-1/6' :
                            'w-2/3 right-0'
                          }`}
                        ></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${asset.changeColor === 'red' ? 'text-red-600' : 'text-green-600'}`}>
                        {asset.change1D}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors">
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hot News Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-gray-900" />
          <h2 className="text-lg font-bold text-gray-900">Hot News</h2>
        </div>

        <div className="relative group">
          <div ref={hotNewsRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
            {hotNews.map((news) => (
              <div
                key={news.id}
                className="min-w-[280px] md:min-w-[320px] rounded-2xl p-4 h-64 border border-gray-100 shadow-sm relative overflow-hidden snap-start hover:shadow-md transition-shadow group/card"
                style={{
                  backgroundImage: `url('${news.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg border border-white/10">{news.date.split(' ')[0]}</span>
                    <span className="bg-[#00A896]/90 backdrop-blur-sm px-2 py-1 rounded-lg font-semibold text-white shadow-sm">{news.type}</span>
                  </div>

                  <div className="space-y-3">
                     <div className="flex items-center gap-2">
                        <span className="bg-[#00A896] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">New</span>
                        <div className="h-px bg-white/30 flex-1"></div>
                     </div>
                    
                    <p className="text-white font-bold text-lg leading-snug line-clamp-3 group-hover/card:text-[#00A896] transition-colors">
                      {news.headline}
                    </p>

                    <div className="flex justify-start">
                      <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-xs font-medium text-white">
                        {news.pair}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => scrollSection(hotNewsRef, 'left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => scrollSection(hotNewsRef, 'right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Market Companion Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-900" />
          <h2 className="text-lg font-bold text-gray-900">Market Companion</h2>
        </div>

        <div className="relative group">
          <div ref={marketCompanionRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
            {marketCompanion.map((tool) => (
              <div
                key={tool.id}
                className="min-w-[280px] md:min-w-[300px] rounded-2xl p-4 h-72 border border-gray-100 shadow-sm relative overflow-hidden snap-start hover:shadow-md transition-shadow group/card"
                style={{
                  backgroundImage: `url('${tool.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
                <div className="relative z-10 h-full flex flex-col">
                  {tool.id === 1 ? (
                    <div className="flex items-center justify-between text-xs mb-auto">
                      <span className="text-white/80 bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">{tool.date.split(' ')[0]}</span>
                      <span className="text-[#00A896] font-bold bg-white/90 px-2 py-1 rounded-lg shadow-sm">{tool.type}</span>
                    </div>
                  ) : (
                    <div className="text-center mb-auto">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm ${tool.direction === 'up' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                        Moving {tool.direction === 'up' ? 'Up' : 'Down'} {tool.change}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-center my-4">
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md">
                      <img
                        src={tool.flag}
                        alt={`${tool.country} Flag`}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-gray-900">{tool.country}</span>
                    </div>
                  </div>

                  <p className="text-center text-sm font-bold text-white leading-snug px-1 line-clamp-3 mb-4 group-hover/card:text-blue-200 transition-colors">
                    {tool.title}
                  </p>

                  <div className="mt-auto bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/10 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">Impact</span>
                      <span className={`font-bold ${tool.impact === 'High' ? 'text-red-400' : 'text-orange-400'}`}>{tool.impact}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">Date</span>
                      <span className="text-white font-bold">
                        {tool.eventDate.split(',')[0]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => scrollSection(marketCompanionRef, 'left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => scrollSection(marketCompanionRef, 'right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Events Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-900" />
          <h2 className="text-lg font-bold text-gray-900">Calendar Events</h2>
        </div>

        <div className="relative group">
          <div ref={calendarEventsRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
            {calendarEvents.map((event) => (
              <div
                key={event.id}
                className="min-w-[280px] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow snap-start flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-bold rounded-full border border-blue-200 text-blue-600 bg-blue-50">
                    {event.type}
                  </span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                    {event.ticker}
                  </span>
                </div>

                <h2 className="text-center text-base font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
                  {event.title}
                </h2>

                <p className="text-center text-gray-500 text-xs mb-3 font-medium">
                  {event.subtitle}
                </p>

                <p className="text-center text-gray-600 text-sm leading-snug flex-1">
                  {event.description}
                </p>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Amount</span>
                  <span className="text-gray-900 font-bold text-lg">{event.amount}</span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => scrollSection(calendarEventsRef, 'left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => scrollSection(calendarEventsRef, 'right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* AnalysisIQ Section */}
      <div className="space-y-4 pb-8">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-900" />
          <h2 className="text-lg font-bold text-gray-900">AnalysisIQ</h2>
        </div>

        <div className="relative group">
          <div ref={analysisIQRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
            {analysisIQ.map((idea) => (
              <div
                key={idea.id}
                className="min-w-[260px] bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow snap-start flex flex-col"
              >
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-gray-100 px-2.5 py-1 rounded-lg text-sm font-bold text-gray-900">{idea.asset}</span>
                    <span className="text-xs font-medium text-gray-500">{idea.period}</span>
                  </div>

                  <div className="flex justify-center">
                    <span className={`w-full text-center ${idea.directionColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs py-1.5 rounded-lg font-bold uppercase tracking-wide`}>
                      {idea.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 flex-1 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Entry</span>
                    <span className="font-bold text-gray-900">{idea.entry}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Target</span>
                    <span className="font-bold text-green-600">{idea.target}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Stop</span>
                    <span className="font-bold text-red-600">{idea.stop}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Confidence</span>
                    <div className="flex gap-1">
                      {[...Array(Math.min(idea.confidence, 4))].map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full ${i === 0 ? 'h-3' : i === 1 ? 'h-4' : i === 2 ? 'h-5' : 'h-6'}`}
                          style={{ backgroundColor: `rgb(${100 + i * 25}, ${100 + i * 25}, ${100 + i * 25})` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                    <span className="text-gray-400 text-xs">Expires</span>
                    <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      1d 7h
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4">
                  <button className="w-full bg-gray-900 text-white text-xs py-2.5 px-3 rounded-xl font-bold hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 group/btn">
                    LEARN MORE
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => scrollSection(analysisIQRef, 'left')} 
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button 
            onClick={() => scrollSection(analysisIQRef, 'right')} 
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-black hover:scale-110 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-gray-900 font-bold mb-2">Filter Options</h4>
              <p className="text-gray-500">
                Advanced filtering options will be available soon.
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Columns Modal */}
      {isColumnsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsColumnsModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
             <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Table Columns</h3>
              <button
                onClick={() => setIsColumnsModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-gray-900 font-bold mb-2">Column Customization</h4>
              <p className="text-gray-500">
                Column customization options will be available soon.
              </p>
            </div>
             <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setIsColumnsModalOpen(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResearchTerminal
