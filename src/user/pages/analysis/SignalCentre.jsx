import { useState } from 'react'

function SignalCentre() {
  const [selectedFilter, setSelectedFilter] = useState('person')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Asset Class')
  const [selectedOptions, setSelectedOptions] = useState([])

  const tradeSignals = [
    {
      id: 1,
      asset: 'XRP',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '2.0420',
      target: '1.7844',
      stop: '2.1435',
      expiry: '4h 38m',
      icon: '💎',
      chartDirection: 'down'
    },
    {
      id: 2,
      asset: 'US2000',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '2355',
      target: '2277',
      stop: '2382',
      expiry: '4h 38m',
      icon: '🇺🇸',
      chartDirection: 'down'
    },
    {
      id: 3,
      asset: 'Litecoin',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '88.45',
      target: '76.45',
      stop: '92.45',
      expiry: '4h 38m',
      icon: '⚪',
      chartDirection: 'down'
    },
    {
      id: 4,
      asset: 'US30',
      type: 'INTRADAY',
      tradeType: 'BUY LIMIT',
      tradeColor: 'green',
      entry: '45515',
      target: '46595',
      stop: '45149',
      expiry: '4h 38m',
      icon: '🇺🇸',
      chartDirection: 'up'
    },
    {
      id: 5,
      asset: 'ETH',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '3018.00',
      target: '2560.00',
      stop: '3138.00',
      expiry: '4h 36m',
      icon: '💎',
      chartDirection: 'down'
    },
    {
      id: 6,
      asset: 'US500',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '6685',
      target: '6505',
      stop: '6745',
      expiry: '4h 36m',
      icon: '🇺🇸',
      chartDirection: 'down'
    },
    {
      id: 7,
      asset: 'BTC',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '91480',
      target: '81050',
      stop: '94480',
      expiry: '4h 36m',
      icon: '🟠',
      chartDirection: 'down'
    },
    {
      id: 8,
      asset: 'US100',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '24473',
      target: '23530',
      stop: '24723',
      expiry: '4h 36m',
      icon: '🇺🇸',
      chartDirection: 'down'
    },
    {
      id: 9,
      asset: 'EUR/GBP',
      type: 'INTRADAY',
      tradeType: 'BUY LIMIT',
      tradeColor: 'green',
      entry: '0.8793',
      target: '0.8838',
      stop: '0.8778',
      expiry: '4h 36m',
      icon: '🇪🇺🇬🇧',
      chartDirection: 'up'
    },
    {
      id: 10,
      asset: 'BRENT',
      type: 'INTRADAY',
      tradeType: 'SELL LIMIT',
      tradeColor: 'red',
      entry: '64.150',
      target: '61.900',
      stop: '64.940',
      expiry: '4h 36m',
      icon: '🛢️',
      chartDirection: 'down'
    },
    {
      id: 11,
      asset: 'XAG/USD',
      type: 'INTRADAY',
      tradeType: 'BUY LIMIT',
      tradeColor: 'green',
      entry: '47.40',
      target: '51.10',
      stop: '46.11',
      expiry: '4h 36m',
      icon: 'Ag',
      chartDirection: 'up'
    },
    {
      id: 12,
      asset: 'GBP/CHF',
      type: 'INTRADAY',
      tradeType: 'BUY LIMIT',
      tradeColor: 'green',
      entry: '1.0495',
      target: '1.0585',
      stop: '1.0464',
      expiry: '4h 36m',
      icon: '🇬🇧🇨🇭',
      chartDirection: 'up'
    }
  ]

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-[95%] mx-auto">
        <h1 className="mb-6" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '400' }}>
          Signal Centre
        </h1>

        {/* Installation Links Section */}
        <div className="w-full bg-[#F6F7F9] py-10 px-4">
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

    {/* MT4 CARD */}
    <div className="bg-white border border-gray-200 rounded-lg py-10 px-6 flex flex-col items-center text-center shadow-sm">
      <h3
        className="mb-6"
        style={{
          fontFamily: "Roboto, sans-serif",
          fontSize: "20px",
          color: "#000000",
          fontWeight: "400",
        }}
      >
        MT4 Signal Centre Installation Link
      </h3>

      <button
        className="bg-white border border-gray-300 text-blue-600 hover:bg-gray-100 font-semibold py-2 px-10 rounded-lg transition"
        style={{
          fontFamily: "Roboto, sans-serif",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        Download
      </button>
    </div>

    {/* MT5 CARD */}
    <div className="bg-white border border-gray-200 rounded-lg py-10 px-6 flex flex-col items-center text-center shadow-sm">
      <h3
        className="mb-6"
        style={{
          fontFamily: "Roboto, sans-serif",
          fontSize: "20px",
          color: "#000000",
          fontWeight: "400",
        }}
      >
        MT5 Signal Centre Installation Link
      </h3>

      <button
        className="bg-white border border-gray-300 text-blue-600 hover:bg-gray-100 font-semibold py-2 px-10 rounded-lg transition"
        style={{
          fontFamily: "Roboto, sans-serif",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        Download
      </button>
    </div>
  </div>
</div>


        {/* AI-Driven Trade Ideas Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors" 
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600', color: '#000000' }}
              >
                FILTERS
              </button>
              
              {/* Filter Icons - Rectangular Premium Style */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFilter('person-star')}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center transition-colors ${
                    selectedFilter === 'person-star' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                >
                  <svg className={`w-5 h-5 ${selectedFilter === 'person-star' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedFilter('person')}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center transition-colors ${
                    selectedFilter === 'person' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                >
                  <svg className={`w-5 h-5 ${selectedFilter === 'person' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedFilter('star')}
                  className={`px-3 py-2 rounded-lg flex items-center justify-center transition-colors ${
                    selectedFilter === 'star' ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                >
                  <svg className={`w-5 h-5 ${selectedFilter === 'star' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Icon */}
              <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* AI-Driven Trade Ideas Label */}
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-orange-600 font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}>
                  AI-Driven Trade Ideas
                </span>
              </div>
            </div>
          </div>

          {/* Trade Signal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tradeSignals.map((signal) => (
              <div key={signal.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                    signal.asset === 'XRP' || signal.asset === 'ETH' ? 'bg-blue-100' : 
                    signal.asset === 'Litecoin' ? 'bg-gray-100' : 
                    signal.asset === 'BTC' ? 'bg-orange-100' :
                    signal.asset === 'BRENT' ? 'bg-black text-white' :
                    signal.asset === 'XAG/USD' ? 'bg-gray-200' :
                    'bg-blue-50'
                  }`}>
                    {signal.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                        {signal.asset}
                      </span>
                      <span className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                        {signal.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trade Type Button */}
                <button className={`mb-2 px-2 py-0.5 rounded text-xs font-semibold ${
                  signal.tradeColor === 'red' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '600' }}>
                  {signal.tradeType}
                </button>

                {/* Trade Details */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>Entry</span>
                    <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: '#000000', fontWeight: '600' }}>{signal.entry}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>Target</span>
                    <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: '#000000', fontWeight: '600' }}>{signal.target}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>Stop</span>
                    <span className="font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', color: '#000000', fontWeight: '600' }}>{signal.stop}</span>
                  </div>
                </div>

                {/* Chart and Confidence Visual */}
                <div className="flex items-center gap-2 mb-2">
                  {/* Mini Chart */}
                  <div className="flex-1 h-8 flex items-end gap-0.5">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t ${
                          signal.chartDirection === 'down' ? 'bg-red-400' : 'bg-green-400'
                        }`}
                        style={{ height: `${Math.random() * 60 + 20}%` }}
                      />
                    ))}
                  </div>

                  {/* Confidence Meter */}
                  <div className="flex items-end gap-0.5 h-8">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-blue-500 rounded-t"
                        style={{ height: `${(i + 1) * 18 + 15}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Expiry and Learn More */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '400' }}>
                    Expires {signal.expiry}
                  </span>
                  <button className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-colors" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '10px', fontWeight: '600' }}>
                    LEARN MORE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
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
                    // Apply filters logic here
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
    </div>
  )
}

export default SignalCentre
