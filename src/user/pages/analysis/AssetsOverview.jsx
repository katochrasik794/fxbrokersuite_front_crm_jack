import React, { useState } from 'react';
import { 
  BarChart2, 
  Search, 
  Filter, 
  Columns, 
  ArrowUp, 
  ArrowDown, 
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';

function AssetsOverview() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Asset Class');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
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
  });

  const assets = [
    {
      id: 1,
      ticker: 'SRCE',
      name: '1st Source Corp',
      logo: 'SRCE',
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
      logo: '3i',
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
      logo: 'MMM',
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
      logo: 'EGHT',
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
  ];

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Bullish') return 'text-emerald-600 bg-emerald-50';
    if (sentiment === 'Bearish') return 'text-rose-600 bg-rose-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendColor = (trend) => {
    if (trend.includes('Bullish')) return 'text-emerald-600';
    if (trend.includes('Bearish')) return 'text-rose-600';
    return 'text-gray-600';
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;

    switch (sortConfig.key) {
      case 'asset':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'price':
        aValue = parseFloat(a.price.replace(/[^0-9.]/g, ''));
        bValue = parseFloat(b.price.replace(/[^0-9.]/g, ''));
        break;
      case 'opportunity':
        aValue = a.opportunity;
        bValue = b.opportunity;
        break;
      case 'priceTrend':
        aValue = a.priceTrendValue;
        bValue = b.priceTrendValue;
        break;
      case 'newsSentiment':
        aValue = a.newsSentimentValue;
        bValue = b.newsSentimentValue;
        break;
      case 'volatility':
        aValue = a.volatility;
        bValue = b.volatility;
        break;
      case 'newsVolume':
        aValue = a.newsVolume;
        bValue = b.newsVolume;
        break;
      case 'change1D':
        aValue = parseFloat(a.change1D.replace(/[^0-9.-]/g, ''));
        bValue = parseFloat(b.change1D.replace(/[^0-9.-]/g, ''));
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filterCategories = [
    'Asset Class', 'Sectors', 'Regions', 'Price Trend', 'News Sentiment', 'Opportunity'
  ];

  const filterOptions = {
    'Asset Class': ['Equities', 'Forex', 'Commodities', 'Cryptocurrencies', 'Indices'],
    'Sectors': ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer Discretionary'],
    'Regions': ['North America', 'Europe', 'Asia Pacific', 'Latin America'],
    'Price Trend': ['Very Bullish', 'Bullish', 'Neutral', 'Bearish', 'Very Bearish'],
    'News Sentiment': ['Very Bullish', 'Bullish', 'Neutral', 'Bearish', 'Very Bearish'],
    'Opportunity': ['Bullish', 'Bearish']
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <PageHeader 
        title="Assets Overview" 
        subtitle="Analyze market assets with real-time data and sentiment analysis"
        icon={BarChart2}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Controls */}
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-xl">
            <div className="flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button 
                onClick={() => setIsColumnsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Columns className="w-4 h-4" />
                Columns
              </button>
            </div>

            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {[
                    { key: 'asset', label: 'Asset' },
                    { key: 'price', label: 'Price' },
                    { key: 'opportunity', label: 'Opportunity' },
                    { key: 'priceTrend', label: 'Price Trend' },
                    { key: 'newsSentiment', label: 'News Sentiment' },
                    { key: 'volatility', label: 'Volatility' },
                    { key: 'newsVolume', label: 'News Volume' },
                    { key: 'change1D', label: 'Change (1D)' },
                  ].map((col) => (
                    <th 
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <div className="flex flex-col">
                          <ArrowUp className={`w-2 h-2 ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-gray-300'}`} />
                          <ArrowDown className={`w-2 h-2 ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shadow-sm">
                          {asset.logo}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{asset.name}</div>
                          <div className="text-xs text-gray-500">{asset.ticker}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {asset.price}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
                          asset.opportunity === 'Bullish' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {asset.opportunity}
                        </span>
                        <div className="flex h-1.5 w-24 rounded-full overflow-hidden bg-gray-100">
                          <div className="bg-rose-500" style={{ width: `${asset.opportunityBar.red}%` }}></div>
                          <div className="bg-amber-500" style={{ width: `${asset.opportunityBar.orange}%` }}></div>
                          <div className="bg-emerald-500" style={{ width: `${asset.opportunityBar.green}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${getTrendColor(asset.priceTrend)}`}>
                        {asset.priceTrend}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Score: {asset.priceTrendValue}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${getSentimentColor(asset.newsSentiment).split(' ')[0]}`}>
                        {asset.newsSentiment}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">Score: {asset.newsSentimentValue}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 mb-1.5">{asset.volatility}</div>
                      <div className="relative w-24 h-1.5 bg-gray-100 rounded-full">
                        <div className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                          asset.volatilityPosition === 'left' ? 'w-1/3 left-0' :
                          asset.volatilityPosition === 'center' ? 'w-1/3 left-1/3' :
                          'w-1/3 right-0'
                        }`}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 mb-1.5">{asset.newsVolume}</div>
                      <div className="relative w-24 h-1.5 bg-gray-100 rounded-full">
                        <div className={`absolute top-0 h-1.5 bg-gray-400 rounded-full ${
                          asset.newsVolumePosition === 'left' ? 'w-1/3 left-0' :
                          asset.newsVolumePosition === 'center' ? 'w-1/3 left-1/3' :
                          'w-1/3 right-0'
                        }`}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${asset.changeColor === 'green' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {asset.change1D}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Details <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Filter Assets</h3>
              <button onClick={() => setIsFilterModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex h-[400px]">
              {/* Categories */}
              <div className="w-1/3 bg-gray-50 border-r border-gray-100 p-2 overflow-y-auto">
                {filterCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      selectedCategory === category 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Options */}
              <div className="w-2/3 p-6 overflow-y-auto">
                <div className="space-y-2">
                  {filterOptions[selectedCategory]?.map(option => (
                    <label key={option} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedOptions.includes(option) 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-gray-300 bg-white group-hover:border-blue-400'
                      }`}>
                        {selectedOptions.includes(option) && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedOptions.includes(option)}
                        onChange={() => {
                          if (selectedOptions.includes(option)) {
                            setSelectedOptions(prev => prev.filter(item => item !== option));
                          } else {
                            setSelectedOptions(prev => [...prev, option]);
                          }
                        }}
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Columns Modal */}
      {isColumnsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsColumnsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Manage Columns</h3>
              <button onClick={() => setIsColumnsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 max-h-[400px] overflow-y-auto">
              <div className="space-y-2">
                {Object.keys(visibleColumns).map(column => (
                  <label key={column} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      visibleColumns[column] 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'border-gray-300 bg-white group-hover:border-blue-400'
                    }`}>
                      {visibleColumns[column] && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={visibleColumns[column]}
                      onChange={() => {
                        setVisibleColumns(prev => ({
                          ...prev,
                          [column]: !prev[column]
                        }));
                      }}
                    />
                    <span className="text-gray-700">{column}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetsOverview;
