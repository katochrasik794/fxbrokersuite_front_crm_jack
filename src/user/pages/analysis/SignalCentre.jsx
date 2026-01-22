import { useState } from 'react'
import { 
  Activity, 
  Filter, 
  X, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Download, 
  ExternalLink,
  ChevronRight,
  Brain,
  Target,
  StopCircle,
  PlayCircle
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'

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

  const categories = [
    'Asset Class',
    'Regions',
    'Themes',
    'FX Groups',
    'Commodity Types',
    'Stock Sectors'
  ]

  const categoryOptions = {
    'Asset Class': ['Stocks', 'Cryptocurrencies', 'Commodities', 'Indices', 'FX'],
    'Regions': ['North America', 'Europe', 'Asia Pacific', 'Emerging Markets'],
    'Themes': ['Technology', 'Green Energy', 'Finance', 'Healthcare'],
    'FX Groups': ['Majors', 'Minors', 'Exotics'],
    'Commodity Types': ['Energy', 'Metals', 'Agriculture'],
    'Stock Sectors': ['Technology', 'Financials', 'Healthcare', 'Consumer Discretionary']
  }

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      setSelectedOptions(selectedOptions.filter(item => item !== option))
    } else {
      setSelectedOptions([...selectedOptions, option])
    }
  }

  return (
    <div className="flex-1 space-y-6">
      <PageHeader 
        title="Signal Centre" 
        subtitle="AI-driven trade ideas and technical analysis"
        icon={Activity}
      />

      {/* Installation Links Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 shadow-sm">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* MT4 CARD */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              MT4 Signal Centre
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Download and install the Signal Centre expert advisor for MetaTrader 4.
            </p>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-8 rounded-xl transition-all shadow-sm hover:shadow-blue-200">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          {/* MT5 CARD */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Download className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              MT5 Signal Centre
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              Download and install the Signal Centre expert advisor for MetaTrader 5.
            </p>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-8 rounded-xl transition-all shadow-sm hover:shadow-indigo-200">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* AI-Driven Trade Ideas Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              
              {/* Filter Icons */}
              <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedFilter('person-star')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    selectedFilter === 'person-star' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="All Signals"
                >
                  <Activity className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedFilter('person')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    selectedFilter === 'person' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Expert Signals"
                >
                  <Target className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedFilter('star')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    selectedFilter === 'star' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="AI Signals"
                >
                  <Brain className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                <Brain className="w-4 h-4 text-orange-600" />
                <span className="text-orange-700 text-sm font-semibold">
                  AI-Driven Ideas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Signal Cards Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tradeSignals.map((signal) => (
            <div key={signal.id} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-all duration-300 hover:border-blue-100 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-opacity group-hover:opacity-20 ${
                signal.tradeColor === 'red' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              
              {/* Card Header */}
              <div className="flex items-start gap-3 mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                  signal.asset === 'XRP' || signal.asset === 'ETH' ? 'bg-blue-50 text-blue-600' : 
                  signal.asset === 'Litecoin' ? 'bg-gray-50 text-gray-600' : 
                  signal.asset === 'BTC' ? 'bg-orange-50 text-orange-600' :
                  signal.asset === 'BRENT' ? 'bg-gray-900 text-white' :
                  signal.asset === 'XAG/USD' ? 'bg-gray-100 text-gray-600' :
                  'bg-indigo-50 text-indigo-600'
                }`}>
                  {signal.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 truncate">
                      {signal.asset}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      signal.tradeColor === 'red' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {signal.tradeType}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {signal.type}
                  </span>
                </div>
              </div>

              {/* Trade Details */}
              <div className="space-y-2 mb-4 bg-gray-50/50 rounded-xl p-3 border border-gray-50">
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Entry</span>
                  </div>
                  <span className="font-mono font-medium text-gray-900">{signal.entry}</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Target className="w-3.5 h-3.5" />
                    <span>Target</span>
                  </div>
                  <span className="font-mono font-medium text-gray-900">{signal.target}</span>
                </div>
                <div className="flex justify-between text-xs items-center">
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </div>
                  <span className="font-mono font-medium text-gray-900">{signal.stop}</span>
                </div>
              </div>

              {/* Chart and Confidence Visual */}
              <div className="flex items-center gap-3 mb-4 h-12">
                {/* Mini Chart */}
                <div className="flex-1 h-full flex items-end gap-1 pb-1 border-b border-gray-100">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm transition-all duration-500 ${
                        signal.chartDirection === 'down' 
                          ? 'bg-gradient-to-t from-red-100 to-red-400 group-hover:from-red-200 group-hover:to-red-500' 
                          : 'bg-gradient-to-t from-green-100 to-green-400 group-hover:from-green-200 group-hover:to-green-500'
                      }`}
                      style={{ height: `${Math.random() * 60 + 20}%` }}
                    />
                  ))}
                </div>

                {/* Confidence Meter */}
                <div className="w-12 h-full flex items-end gap-0.5 pb-1 border-b border-gray-100">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-full bg-blue-200 rounded-t-sm"
                      style={{ height: `${(i + 1) * 20 + 10}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Expiry and Learn More */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{signal.expiry}</span>
                </div>
                <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Details
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-bold text-gray-900">Filter Signals</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex h-[400px]">
              {/* Left Pane - Filter Categories */}
              <div className="w-1/3 border-r border-gray-100 bg-gray-50/50 p-2 overflow-y-auto">
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === category 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Pane - Options/Checkboxes */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">
                  {categoryOptions[selectedCategory]?.map((option) => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedOptions.includes(option)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selectedOptions.includes(option) && <X className="w-3 h-3 rotate-45" />}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedOptions.includes(option)}
                        onChange={() => toggleOption(option)}
                      />
                      <span className="text-sm font-medium text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedOptions([])
                  setIsFilterModalOpen(false)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-blue-200 transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SignalCentre
