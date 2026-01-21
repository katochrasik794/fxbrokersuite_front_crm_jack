import { useState, useRef } from 'react'

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

  const scrollMarketCompanionLeft = () => {
    if (marketCompanionRef.current) {
      marketCompanionRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollMarketCompanionRight = () => {
    if (marketCompanionRef.current) {
      marketCompanionRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const scrollCalendarEventsLeft = () => {
    if (calendarEventsRef.current) {
      calendarEventsRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollCalendarEventsRight = () => {
    if (calendarEventsRef.current) {
      calendarEventsRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const scrollAnalysisIQLeft = () => {
    if (analysisIQRef.current) {
      analysisIQRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollAnalysisIQRight = () => {
    if (analysisIQRef.current) {
      analysisIQRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-[95%] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '28px', color: '#000000', fontWeight: '700' }}>
              Latest Insights
            </h1>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors" 
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600', color: '#000000' }}
            >
              FILTERS
            </button>
          </div>
        </div>

        {/* Asset Type Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedAssetType('equity')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedAssetType === 'equity' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Equity
          </button>
          <button
            onClick={() => setSelectedAssetType('currency')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedAssetType === 'currency' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Currency
          </button>
          <button
            onClick={() => setSelectedAssetType('commodity')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedAssetType === 'commodity' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Commodity
          </button>
          <button
            onClick={() => setSelectedAssetType('index')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedAssetType === 'index' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Index
          </button>
          <button
            onClick={() => setSelectedAssetType('crypto')}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedAssetType === 'crypto' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
            style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Crypto
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left Column - News Article */}
          <div className="lg:col-span-1 bg-white rounded-lg p-6 border border-gray-200 shadow-md">
            <div className="mb-4">
              <div className="text-green-600 font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}>
                MOVING UP 2.4%
              </div>
              <p className="text-sm text-gray-700 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: '400', lineHeight: '1.5' }}>
                Adobe Inc rises amid strong services demand; mixed manufacturing signals persist. Despite a 30% year-to-date decline, growth projections remain optimistic.
              </p>
              <button className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '500' }}>
                READ MORE
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-2 gap-2 p-4">
                  <div className="text-xs font-semibold text-gray-600">New York</div>
                  <div className="text-xs font-semibold text-gray-600">Frankfurt</div>
                  <div className="text-xs font-semibold text-gray-600">Singapore</div>
                  <div className="text-xs font-semibold text-gray-600">API</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
              BY ACUITY
            </div>
          </div>

          {/* Middle Columns - Hot Trade Ideas */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {hotTradeIdeas.map((idea) => (
              <div key={idea.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-bold">
                      {idea.assetIcon}
                    </div>
                    <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                      {idea.asset}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                    {idea.timestamp}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                      HOT TRADE IDEA
                    </span>
                    <span className="text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600', color: '#000000' }}>
                      AnalysisIQ
                    </span>
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                    Exp: {idea.expiration}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div>
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>Direction</span>
                    <div className={`font-semibold ${idea.directionColor === 'red' ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {idea.direction}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>Period</span>
                    <div className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600', color: '#000000' }}>
                      {idea.period}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>Stop</span>
                    <div className="font-semibold text-red-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {idea.stop}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>Entry</span>
                    <div className="font-semibold text-blue-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {idea.entry}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>Target</span>
                    <div className="font-semibold text-green-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {idea.target}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>Confidence</span>
                    <div className="flex items-end gap-0.5 h-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 rounded-t ${i < idea.confidence ? 'bg-blue-500' : 'bg-gray-200'}`}
                          style={{ height: `${(i + 1) * 20}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 h-12 flex items-end gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${
                          idea.chartDirection === 'down' ? 'bg-red-400' : 'bg-green-400'
                        }`}
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      />
                    ))}
                  </div>
                  <div className="ml-2 flex flex-col items-end gap-1">
                    <div className="text-xs font-semibold text-red-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '9px', fontWeight: '600' }}>
                      Stop: {idea.stop}
                    </div>
                    <div className="text-xs font-semibold text-blue-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '9px', fontWeight: '600' }}>
                      Entry: {idea.entry}
                    </div>
                    <div className="text-xs font-semibold text-green-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '9px', fontWeight: '600' }}>
                      Target: {idea.target}
                    </div>
                  </div>
                </div>

                <div className={`text-xs font-semibold ${idea.statusColor === 'red' ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                  Status: {idea.status}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Most Popular */}
          <div className="lg:col-span-1 space-y-4">
            {mostPopular.map((item) => (
              <div key={item.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs">
                      {item.assetIcon}
                    </div>
                    <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>
                      {item.asset}
                    </span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                    News Volume
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '9px', fontWeight: '400' }}>
                    30 day average
                  </div>
                </div>
                <div className="h-24 bg-gray-50 rounded mb-2 flex items-end gap-1 p-2">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t"
                      style={{ height: `${Math.random() * 70 + 20}%` }}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '9px', fontWeight: '400' }}>
                  {item.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets to Watch Section */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '700' }}>
                Assets to Watch
              </h2>
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '500' }}>
                VIEW ALL
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button 
                onClick={() => setIsColumnsModalOpen(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600', color: '#000000' }}>
                  COLUMNS
                </span>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Assets Table */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>Asset</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>Opportunity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>Price Trend</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>News Sentiment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>Volatility</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>News Volume</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>Change (1D)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
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
                  ].map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm">
                            {asset.icon}
                          </div>
                          <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                            {asset.asset}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#000000', fontWeight: '400' }}>
                        {asset.price}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className={`text-xs font-semibold mb-1 ${asset.opportunityColor === 'red' ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                            {asset.opportunity}
                          </div>
                          <div className="flex h-1.5 rounded overflow-hidden">
                            <div className="bg-red-500" style={{ width: `${asset.opportunityBar.red}%` }}></div>
                            <div className="bg-orange-500" style={{ width: `${asset.opportunityBar.orange}%` }}></div>
                            <div className="bg-green-500" style={{ width: `${asset.opportunityBar.green}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className={`text-xs font-semibold ${asset.priceTrendColor === 'red' ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                            {asset.priceTrend}
                          </div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                            {asset.priceTrendValue}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className={`text-xs font-semibold ${asset.newsSentimentColor === 'red' ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                            {asset.newsSentiment}
                          </div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                            {asset.newsSentimentValue}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                            {asset.volatility}
                          </div>
                          <div className="relative w-16 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                                asset.volatilityPosition === 'left' ? 'w-1/3' :
                                asset.volatilityPosition === 'center' ? 'w-2/3 left-1/6' :
                                'w-2/3 right-0'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                            {asset.newsVolume}
                          </div>
                          <div className="relative w-16 h-1.5 bg-gray-200 rounded-full">
                            <div
                              className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                                asset.newsVolumePosition === 'left' ? 'w-1/3' :
                                asset.newsVolumePosition === 'center' ? 'w-2/3 left-1/6' :
                                'w-2/3 right-0'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${asset.changeColor === 'red' ? 'text-red-600' : 'text-green-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', fontWeight: '600' }}>
                          {asset.change1D}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-colors" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                          LEARN MORE
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

        {/* Market Companion Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '700' }}>
              Market Companion
            </h2>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative">
            <div ref={marketCompanionRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {[
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
              ].map((tool) => (
                <div
                  key={tool.id}
                  className="min-w-[240px] rounded-lg p-3 pb-6 border border-gray-200 shadow-md relative overflow-hidden"
                  style={{
                    backgroundImage: `url('${tool.image}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-60"></div>
                  <div className="relative z-10">
                    {tool.id === 1 ? (
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-500">{tool.date}</span>
                        <span className="text-[#00A896] font-semibold">{tool.type}</span>
                      </div>
                    ) : (
                      <div className="text-center mb-2">
                        <span className={`text-sm font-semibold ${tool.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          Moving {tool.direction === 'up' ? 'Up' : 'Down'} {tool.change}
                        </span>
                      </div>
                    )}

                    {/* Country Pill */}
                    <div className="flex justify-center mb-2">
                      <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-md">
                        <img
                          src={tool.flag}
                          alt={`${tool.country} Flag`}
                          className="w-4 h-4 rounded-sm"
                        />
                        <span className="text-xs font-medium">{tool.country}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <p className="text-center text-sm font-medium text-black leading-snug px-1">
                      {tool.title.split(' ').slice(0, 4).join(' ')} <br />
                      {tool.title.split(' ').slice(4, 8).join(' ')} <br />
                      {tool.title.split(' ').slice(8, 12).join(' ')} <br />
                      {tool.title.split(' ').slice(12).join(' ')}
                    </p>

                    {/* Event Details */}
                    <p className="mt-3 text-center font-semibold text-black text-sm">
                      Event Details
                    </p>

                    {/* Detail Rows */}
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">Impact</span>
                        <span className={`font-semibold ${tool.impact === 'High' ? 'text-red-600' : 'text-orange-600'}`}>{tool.impact}</span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">Date</span>
                        <span className="text-black font-semibold">
                          {tool.eventDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={scrollMarketCompanionLeft} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={scrollMarketCompanionRight} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Events Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '700' }}>
              Calendar Events
            </h2>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative">
            <div ref={calendarEventsRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {[
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
              ].map((event) => (
                <div
                  key={event.id}
                  className="min-w-[280px] bg-white rounded-lg p-4 border border-gray-200 shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    {/* Dividends Pill */}
                    <span className="px-3 py-1 text-sm font-medium rounded-full border border-blue-500 text-blue-600 bg-white">
                      {event.type}
                    </span>
                    {/* Ticker Pill */}
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-300 text-gray-700">
                      {event.ticker}
                    </span>
                  </div>

                  {/* Main Title */}
                  <h2 className="text-center text-base font-semibold text-[#000] leading-tight">
                    {event.title.split(' ').slice(0, -1).join(' ')}<br />{event.title.split(' ').slice(-1)}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-center text-gray-700 text-xs mt-2">
                    {event.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-center text-gray-700 text-xs mt-3 leading-snug">
                    {event.description.split(' ').slice(0, -2).join(' ')}<br />{event.description.split(' ').slice(-2).join(' ')}
                  </p>

                  {/* Amount Section */}
                  <div className="flex justify-between items-center mt-6 text-sm">
                    <span className="text-gray-500 font-medium">Amount</span>
                    <span className="text-black font-semibold">{event.amount}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={scrollCalendarEventsLeft} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={scrollCalendarEventsRight} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* AnalysisIQ Section */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '700' }}>
              AnalysisIQ
            </h2>
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="relative">
            <div ref={analysisIQRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
              {[
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
              ].map((idea) => (
                <div
                  key={idea.id}
                  className="min-w-[240px] h-64 bg-white rounded-lg p-4 border border-gray-200 shadow-md flex flex-col"
                >
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                      <span className="bg-gray-100 px-2 py-1 rounded-md">{idea.asset}</span>
                      <span className="text-gray-600">{idea.period}</span>
                    </div>

                    {/* BUY LIMIT Badge */}
                    <div className="flex justify-center mt-2">
                      <span className={`bg-${idea.directionColor === 'green' ? 'green' : 'red'}-600 text-white text-xs px-3 py-1 rounded-full font-bold`}>
                        {idea.status}
                      </span>
                    </div>
                  </div>

                  {/* Values */}
                  <div className="text-xs text-gray-700 space-y-1 flex-1 mt-4">
                    <div className="flex justify-between">
                      <span>Entry</span>
                      <span className="font-bold">{idea.entry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target</span>
                      <span className="font-bold">{idea.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stop</span>
                      <span className="font-bold">{idea.stop}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Confidence</span>
                      <div className="flex gap-1">
                        {[...Array(Math.min(idea.confidence, 4))].map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 rounded ${i === 0 ? 'h-3' : i === 1 ? 'h-4' : i === 2 ? 'h-5' : 'h-6'}`}
                            style={{ backgroundColor: `rgb(${100 + i * 25}, ${100 + i * 25}, ${100 + i * 25})` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires</span>
                      <span className="text-green-500 font-bold">1d 7h</span>
                    </div>
                  </div>

                  {/* Learn More Button */}
                  <div className="flex justify-center mt-auto">
                    <button className="bg-gray-900 text-white text-xs py-1 px-3 rounded-md font-semibold hover:bg-black transition">
                      LEARN MORE
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={scrollAnalysisIQLeft} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button onClick={scrollAnalysisIQRight} className="w-8 h-8 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-900 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        

        

      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-gray-100 rounded-lg w-full max-w-2xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-gray-800 hover:text-black transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-center text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}>
                Filter options coming soon
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResearchTerminal
