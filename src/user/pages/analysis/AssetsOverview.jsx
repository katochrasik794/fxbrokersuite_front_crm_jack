import { useState } from 'react'

function AssetsOverview() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Asset Class')
  const [selectedOptions, setSelectedOptions] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    'All': false,
    'Price Trend': true,
    'News Sentiment': true,
    'Volatility': true,
    'News Volume': true,
    'Change (1D)': true,
    'Change (1W)': false,
    'Change (1M)': false,
    'Change (3M)': false,
    'Change (6M)': false,
    'Change (1Y)': false
  })

  const assets = [
    {
      id: 1,
      ticker: 'SRCE',
      name: '1st Source Corp',
      logo: '1st SRCE',
      price: '$61.51',
      opportunity: 'Bearish',
      opportunityBar: { red: 70, orange: 20, green: 10 },
      priceTrend: 'Bearish',
      priceTrendValue: -30,
      newsSentiment: 'Bullish',
      newsSentimentValue: 1,
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Below Average',
      newsVolumePosition: 'left',
      change1D: '+0.44%',
      changeColor: 'green'
    },
    {
      id: 2,
      ticker: 'DDD',
      name: '3D Systems Corp',
      logo: 'DDD',
      price: '$1.85',
      opportunity: 'Bearish',
      opportunityBar: { red: 60, orange: 25, green: 15 },
      priceTrend: 'Bearish',
      priceTrendValue: -50,
      newsSentiment: 'Bullish',
      newsSentimentValue: 2,
      volatility: 'Above Average',
      volatilityPosition: 'right',
      newsVolume: 'Average',
      newsVolumePosition: 'center',
      change1D: '-6.09%',
      changeColor: 'red'
    },
    {
      id: 3,
      ticker: '3i Group',
      name: '3i Group PLC',
      logo: '3 3i Group...',
      price: 'p3260.11',
      opportunity: 'Bearish',
      opportunityBar: { red: 65, orange: 20, green: 15 },
      priceTrend: 'Neutral',
      priceTrendValue: 0,
      newsSentiment: 'Bearish',
      newsSentimentValue: -3,
      volatility: 'Above Average',
      volatilityPosition: 'right',
      newsVolume: 'Above Average',
      newsVolumePosition: 'right',
      change1D: '-1.52%',
      changeColor: 'red'
    },
    {
      id: 4,
      ticker: 'MMM',
      name: '3M Co',
      logo: '3M MMM',
      price: '$166.96',
      opportunity: 'Bullish',
      opportunityBar: { red: 10, orange: 20, green: 70 },
      priceTrend: 'Very Bullish',
      priceTrendValue: 100,
      newsSentiment: 'Bullish',
      newsSentimentValue: 31,
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Above Average',
      newsVolumePosition: 'right',
      change1D: '-0.17%',
      changeColor: 'red'
    },
    {
      id: 5,
      ticker: 'EGHT',
      name: '8X8 Inc',
      logo: '8x8 EGHT',
      price: '$1.87',
      opportunity: 'Bearish',
      opportunityBar: { red: 75, orange: 15, green: 10 },
      priceTrend: 'Very Bearish',
      priceTrendValue: -80,
      newsSentiment: 'Neutral',
      newsSentimentValue: 0,
      volatility: 'Below Average',
      volatilityPosition: 'left',
      newsVolume: 'Above Average',
      newsVolumePosition: 'right',
      change1D: '-2.36%',
      changeColor: 'red'
    }
  ]

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Bullish') return 'text-green-600'
    if (sentiment === 'Bearish') return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendColor = (trend) => {
    if (trend.includes('Bullish')) return 'text-green-600'
    if (trend.includes('Bearish')) return 'text-red-600'
    return 'text-gray-600'
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortConfig.key) return 0

    let aValue, bValue

    switch (sortConfig.key) {
      case 'asset':
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case 'price':
        aValue = parseFloat(a.price.replace(/[^0-9.]/g, ''))
        bValue = parseFloat(b.price.replace(/[^0-9.]/g, ''))
        break
      case 'opportunity':
        aValue = a.opportunity
        bValue = b.opportunity
        break
      case 'priceTrend':
        aValue = a.priceTrendValue
        bValue = b.priceTrendValue
        break
      case 'newsSentiment':
        aValue = a.newsSentimentValue
        bValue = b.newsSentimentValue
        break
      case 'volatility':
        aValue = a.volatility
        bValue = b.volatility
        break
      case 'newsVolume':
        aValue = a.newsVolume
        bValue = b.newsVolume
        break
      case 'change1D':
        aValue = parseFloat(a.change1D.replace(/[^0-9.-]/g, ''))
        bValue = parseFloat(b.change1D.replace(/[^0-9.-]/g, ''))
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-[95%] mx-auto">
        <h1 className="mb-6" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '400' }}>
          Assets Overview
        </h1>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors" 
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600', color: '#000000' }}
            >
              FILTERS
            </button>

            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A896] focus:border-transparent outline-none"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* COLUMNS Dropdown */}
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

          {/* Table Container with Horizontal Scroll */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="min-w-[800px]">
              {/* Table Headers */}
              <div className="grid grid-cols-8 gap-6 pb-3 border-b border-gray-200 mb-4 px-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600', color: '#000000' }}>
                <div
                  onClick={() => handleSort('asset')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Asset
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'asset' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'asset' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('price')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Price
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'price' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'price' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('opportunity')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Opportunity
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'opportunity' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'opportunity' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('priceTrend')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Price Trend
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'priceTrend' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'priceTrend' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('newsSentiment')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  News Sentiment
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'newsSentiment' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'newsSentiment' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('volatility')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Volatility
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'volatility' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'volatility' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('newsVolume')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  News Volume
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'newsVolume' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'newsVolume' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
                <div
                  onClick={() => handleSort('change1D')}
                  className="flex items-center gap-1 cursor-pointer hover:text-gray-600 transition-colors"
                >
                  Change (1D)
                  <svg className={`w-3 h-3 transition-transform ${sortConfig.key === 'change1D' ? 'opacity-100' : 'opacity-30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortConfig.key === 'change1D' && sortConfig.direction === 'desc' ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                  </svg>
                </div>
              </div>

              {/* Asset Rows */}
              <div className="space-y-3">
                {sortedAssets.map((asset) => (
                  <div key={asset.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-8 gap-6 items-center px-2">
                  {/* Asset */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '9px', color: '#000000', fontWeight: '600' }}>
                      {asset.logo}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>
                        {asset.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                        {asset.ticker}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '400' }}>
                    {asset.price}
                  </div>

                  {/* Opportunity */}
                  <div className="min-w-0">
                    <div className={`text-xs mb-1 ${getSentimentColor(asset.opportunity)}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {asset.opportunity}
                    </div>
                    <div className="flex h-1.5 rounded overflow-hidden">
                      <div className="bg-red-500" style={{ width: `${asset.opportunityBar.red}%` }}></div>
                      <div className="bg-orange-500" style={{ width: `${asset.opportunityBar.orange}%` }}></div>
                      <div className="bg-green-500" style={{ width: `${asset.opportunityBar.green}%` }}></div>
                    </div>
                  </div>

                  {/* Price Trend */}
                  <div className="min-w-0">
                    <div className={`text-xs ${getTrendColor(asset.priceTrend)}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {asset.priceTrend}
                    </div>
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                      {asset.priceTrendValue}
                    </div>
                  </div>

                  {/* News Sentiment */}
                  <div className="min-w-0">
                    <div className={`text-xs ${getSentimentColor(asset.newsSentiment)}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {asset.newsSentiment}
                    </div>
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                      {asset.newsSentimentValue}
                    </div>
                  </div>

                  {/* Volatility */}
                  <div className="min-w-0">
                    <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                      {asset.volatility}
                    </div>
                    <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                      <div
                        className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                          asset.volatilityPosition === 'left' ? 'w-1/3' :
                          asset.volatilityPosition === 'center' ? 'w-2/3 left-1/6' :
                          'w-2/3 right-0'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* News Volume */}
                  <div className="min-w-0">
                    <div className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                      {asset.newsVolume}
                    </div>
                    <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                      <div
                        className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                          asset.newsVolumePosition === 'left' ? 'w-1/3' :
                          asset.newsVolumePosition === 'center' ? 'w-2/3 left-1/6' :
                          'w-2/3 right-0'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Change (1D) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold whitespace-nowrap ${asset.changeColor === 'green' ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '600' }}>
                      {asset.change1D}
                    </span>
                    <button className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-colors whitespace-nowrap flex-shrink-0" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '600' }}>
                      LEARN MORE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal - Same as Signal Centre */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-gray-100 rounded-lg w-full max-w-2xl mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
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

            {/* Main Content */}
            <div className="flex border-t border-gray-300">
              {/* Left Pane - Filter Categories */}
              <div className="w-1/3 border-r border-gray-300 p-4">
                <div className="space-y-3">
                  <div
                    onClick={() => setSelectedCategory('Asset Class')}
                    className={`cursor-pointer ${selectedCategory === 'Asset Class' ? 'text-[#00A896]' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: selectedCategory === 'Asset Class' ? '600' : '400' }}
                  >
                    Asset Class
                  </div>
                  <div
                    onClick={() => setSelectedCategory('Regions')}
                    className={`cursor-pointer ${selectedCategory === 'Regions' ? 'text-[#00A896]' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: selectedCategory === 'Regions' ? '600' : '400' }}
                  >
                    Regions
                  </div>
                  <div
                    onClick={() => setSelectedCategory('Themes')}
                    className={`cursor-pointer ${selectedCategory === 'Themes' ? 'text-[#00A896]' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: selectedCategory === 'Themes' ? '600' : '400' }}
                  >
                    Themes
                  </div>
                  <div
                    onClick={() => setSelectedCategory('FX Groups')}
                    className={`cursor-pointer ${selectedCategory === 'FX Groups' ? 'text-[#00A896]' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: selectedCategory === 'FX Groups' ? '600' : '400' }}
                  >
                    FX Groups
                  </div>
                  <div
                    onClick={() => setSelectedCategory('Commodity Types')}
                    className={`cursor-pointer ${selectedCategory === 'Commodity Types' ? 'text-[#00A896]' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: selectedCategory === 'Commodity Types' ? '600' : '400' }}
                  >
                    Commodity Types
                  </div>
                  <div
                    onClick={() => setSelectedCategory('Stock Sectors')}
                    className={`cursor-pointer ${selectedCategory === 'Stock Sectors' ? 'text-[#00A896]' : 'text-gray-700'}`}
                    style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: selectedCategory === 'Stock Sectors' ? '600' : '400' }}
                  >
                    Stock Sectors
                  </div>
                </div>
              </div>

              {/* Right Pane - Options/Checkboxes */}
              <div className="flex-1 p-4">
                {selectedCategory === 'Asset Class' && (
                  <div className="space-y-3">
                    {['Stocks', 'Cryptocurrencies', 'Commodities', 'Indices', 'FX'].map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(option)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOptions([...selectedOptions, option])
                            } else {
                              setSelectedOptions(selectedOptions.filter(item => item !== option))
                            }
                          }}
                          className="w-4 h-4 text-[#00A896] border-gray-300 rounded focus:ring-[#00A896]"
                        />
                        <span className="ml-3 text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}>
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {selectedCategory !== 'Asset Class' && (
                  <div className="text-gray-500 text-sm" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}>
                    No options available for this category
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-300 p-4 flex items-center justify-between">
              <div className="text-[#00A896]" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}>
                Results: 1635
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="px-6 py-2 border border-gray-400 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    setIsFilterModalOpen(false)
                  }}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
                >
                  APPLY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COLUMNS Modal */}
      {isColumnsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsColumnsModalOpen(false)}>
          <div className="bg-gray-100 rounded-lg w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-300">
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: '600', color: '#000000' }}>
                  COLUMNS
                </span>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <button
                onClick={() => setIsColumnsModalOpen(false)}
                className="text-gray-800 hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Column List */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {Object.keys(visibleColumns).map((column) => (
                  <div key={column} className="flex items-center justify-between p-2 hover:bg-gray-200 rounded transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={visibleColumns[column]}
                        onChange={(e) => {
                          if (column === 'All') {
                            const allChecked = !visibleColumns[column]
                            const newState = {}
                            Object.keys(visibleColumns).forEach(key => {
                              newState[key] = allChecked
                            })
                            setVisibleColumns(newState)
                          } else {
                            setVisibleColumns({
                              ...visibleColumns,
                              [column]: e.target.checked,
                              'All': false
                            })
                          }
                        }}
                        className="w-4 h-4 text-[#00A896] border-gray-300 rounded focus:ring-[#00A896]"
                      />
                      <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400', color: '#000000' }}>
                        {column}
                      </span>
                    </label>
                    <div className="cursor-move p-1">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DONE Button */}
            <div className="p-4 border-t border-gray-300 flex justify-center">
              <button
                onClick={() => setIsColumnsModalOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetsOverview
