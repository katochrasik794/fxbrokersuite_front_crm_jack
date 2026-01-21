import { useState } from 'react'
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import TradingViewWidget from './TradingViewWidget';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

function MarketChartSection() {
  return (
    <div className="w-full bg-gray-100 p-5 md:p-8 rounded-xl mt-6">
      {/* Top Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

        {/* Left Side */}
        <div className="flex items-start gap-4">

          {/* Flags */}
          <div className="flex flex-col items-center">
            <img
              src="/flag-icon.svg"
              alt="flags"
              className="w-14 h-14 object-cover rounded-md"
            />
          </div>

          {/* Pair Info */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm bg-gray-200 px-3 py-1 rounded-md">
                USD/MXN
              </span>
              <span className="bg-green-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                BUY LIMIT
              </span>
            </div>

            <h2 className="text-3xl font-bold mt-2">USDMXN</h2>

            {/* Entry/Target/Stop */}
            <div className="flex flex-wrap gap-10 mt-4 text-center">
              <div>
                <p className="text-green-600 text-xl font-semibold">18.45000</p>
                <p className="text-gray-600 text-sm">Entry</p>
              </div>

              <div>
                <p className="text-green-600 text-xl font-semibold">18.60000</p>
                <p className="text-gray-600 text-sm">Target</p>
              </div>

              <div>
                <p className="text-red-500 text-xl font-semibold">18.37500</p>
                <p className="text-gray-600 text-sm">Stop</p>
              </div>

              <div>
                <p className="text-gray-900 text-xl font-semibold">Intraday</p>
                <p className="text-gray-600 text-sm">Duration</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center gap-1">
                  <div className="w-1.5 h-5 bg-gray-500 rounded"></div>
                  <div className="w-1.5 h-5 bg-gray-500 rounded"></div>
                  <div className="w-1.5 h-7 bg-gray-800 rounded"></div>
                  <div className="w-1.5 h-4 bg-gray-400 rounded"></div>
                </div>
                <p className="text-gray-600 text-sm mt-1">Confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="text-right">
          <p className="text-4xl font-bold">18.47099</p>
          <p className="text-green-600 font-semibold">
            ▲ 0.00686 (+0.04%)
          </p>
        </div>
      </div>

      {/* Chart Title */}
      <h3 className="text-2xl font-semibold mt-10 mb-4">Market Chart (4H)</h3>

      {/* Toolbar */}
      <div className="flex items-center gap-6 text-gray-700 font-medium text-sm border-b pb-2">
        <button className="text-black font-semibold">4h</button>
        <button>💹</button>
        <button>📈</button>
        <button>Indicators</button>
        <button>↩</button>
        <button>↪</button>
      </div>

      {/* TradingView Chart */}
      <div className="w-full h-[450px] mt-4 rounded-lg overflow-hidden">
        <TradingViewWidget />
      </div>
    </div>
  );
}

function TradeIdeaPerformance() {
  const [activeTab, setActiveTab] = useState("recent");

  const labels = [
    "Oct 2025",
    "Oct 2025",
    "Nov 2025",
    "Nov 2025",
    "Nov 2025",
    "Nov 2025",
    "Nov 2025",
  ];

  const pricePoints = [1000, 998, 1005, 1012, 1003, 999, 1008, 995];
  const markerColors = ["red", "green", "green", "red", "red", "red", "green", "red"];

  const data = {
    labels,
    datasets: [
      {
        label: "Equity",
        data: pricePoints,
        borderColor: "#1f2937",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        labels: "Trades",
        data: pricePoints,
        pointBackgroundColor: markerColors,
        pointBorderColor: markerColors,
        pointRadius: 7,
        pointHoverRadius: 8,
        borderWidth: 0,
        showLine: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#000",
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },

    scales: {
      y: {
        grid: { display: true, color: "rgba(0,0,0,0.1)" },
        ticks: { font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  };

  return (
    <div className="w-full bg-gray-100 p-5 md:p-8 rounded-xl mt-8">
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
        Trade Idea Performance
      </h2>

      {/* Tabs */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={() => setActiveTab("recent")}
          className={`px-4 py-2 rounded-md font-semibold text-sm ${
            activeTab === "recent"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          MOST RECENT
        </button>

        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-4 py-2 rounded-md font-semibold text-sm ${
            activeTab === "monthly"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border"
          }`}
        >
          MONTHLY
        </button>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px] sm:h-[350px] md:h-[420px] mt-6">
        <Line data={data} options={options} />
      </div>

      {/* Legend under chart */}
      <div className="flex flex-wrap gap-6 text-sm mt-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-600 rounded-full"></span> Winning Trade
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full"></span> Losing Trade
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-teal-600 rounded-full"></span> Live Trade
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 bg-gray-800"></span> Equity
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-600 mt-4 leading-relaxed max-w-3xl">
        The equity curve is based on the last 10 trade ideas using a nominal 1000 starting
        balance, risking 1% per trade. This is for illustration only and may not suit all
        investors. Past performance does not guarantee future results. Ensure you understand
        the risks and seek independent advice if needed. Your capital is at risk.
      </p>

      {/* Stats Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-teal-600">Total Trades: 217</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">

          {/* Win Rate */}
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Win Rate</span>
            <span className="text-xl font-semibold">51.61</span>
          </div>

          {/* Avg Duration */}
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Average duration of trades</span>
            <span className="text-xl font-semibold">12.79</span>
          </div>

          {/* Avg Outcome */}
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Average outcome per trade</span>
            <span className="text-xl font-semibold">0.45%</span>
          </div>

          {/* Best Trade */}
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Best trade</span>
            <span className="text-xl font-semibold">+8.23%</span>
          </div>

          {/* Worst Trade */}
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Worst trade</span>
            <span className="text-xl font-semibold">-4.56%</span>
          </div>

          {/* Max Drawdown */}
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Max drawdown</span>
            <span className="text-xl font-semibold">-12.34%</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function NewsSentiment() {
  const labels = [
    "27.10", "30.10", "04.11", "07.11", "12.11", "17.11", "20.11"
  ];

  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: [1.775, 1.768, 1.764, 1.781, 1.773, 1.789, 1.782],
        borderColor: "#000",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: "Sentiment",
        data: [0.2, -0.3, -0.6, 0.1, -0.2, -0.5, 0.3],
        backgroundColor: (ctx) => {
          const value = ctx.raw;
          return value >= 0 ? "rgba(0, 150, 80, 0.4)" : "rgba(255, 99, 99, 0.4)";
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          boxWidth: 10,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#000",
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },

    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        grid: {
          color: "rgba(0,0,0,0.15)",
          lineWidth: 0.4,
          drawBorder: false,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
    },
  };

  return (
    <div className="w-full bg-gray-100 p-5 md:p-8 rounded-xl mt-6">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-6">
        News Sentiment
      </h2>

      <div className="w-full h-[300px] sm:h-[350px] md:h-[450px] lg:h-[500px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

function MarketCalendar() {
  const [calendarType, setCalendarType] = useState('ECONOMIC')
  const [selectedDate, setSelectedDate] = useState('2025-11-21')
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const events = {
    '2025-11-17': [
      { id: 1, country: 'US', countryCode: 'US', name: '3-Month Bill Auction', time: '22:00', badge: 17, color: 'green' },
      { id: 2, country: 'US', countryCode: 'US', name: 'Fed\'s Kashkari speech', time: '23:30', badge: 21, color: 'grey' },
      { id: 3, country: 'CA', countryCode: 'CA', name: 'Consumer Price Index (YoY)', time: '19:00', badge: 3, color: 'red' }
    ],
    '2025-11-18': [
      { id: 4, country: 'US', countryCode: 'US', name: 'NAHB Housing Market Index', time: '20:30', badge: 7, color: 'green' },
      { id: 5, country: 'GB', countryCode: 'GB', name: 'BoE\'s Dhingra speech', time: '22:30', badge: 9, color: 'grey' },
      { id: 6, country: 'AU', countryCode: 'AU', name: 'RBA Meeting Minutes', time: '06:00', badge: 3, color: 'red' }
    ],
    '2025-11-19': [
      { id: 7, country: 'US', countryCode: 'US', name: '20-Year Bond Auction', time: '23:30', badge: 27, color: 'green' },
      { id: 8, country: 'US', countryCode: 'US', name: 'Fed\'s Miran speech', time: '20:30', badge: 13, color: 'grey' },
      { id: 9, country: 'GB', countryCode: 'GB', name: 'Core Consumer Price Index (YoY)', time: '12:30', badge: 3, color: 'red' }
    ],
    '2025-11-20': [
      { id: 10, country: 'US', countryCode: 'US', name: '10-year TIPS Auction', time: '23:30', badge: 41, color: 'green' },
      { id: 11, country: 'US', countryCode: 'US', name: 'Fed\'s Cook speech', time: '21:30', badge: 15, color: 'grey' },
      { id: 12, country: 'US', countryCode: 'US', name: 'Labor Force Participation Rate', time: '19:00', badge: 8, color: 'red' }
    ],
    '2025-11-21': [
      { id: 13, country: 'US', countryCode: 'US', name: 'Baker Hughes US Oil Rig Count', time: '23:30', badge: 15, color: 'green' },
      { id: 14, country: 'GB', countryCode: 'GB', name: 'BoE\'s Pill speech', time: '21:10', badge: 42, color: 'grey' },
      { id: 15, country: 'US', countryCode: 'US', name: 'S&P Global Manufacturing PMI', time: '20:15', badge: 14, color: 'red' }
    ],
    '2025-11-22': [
      { id: 16, country: 'US', countryCode: 'US', name: 'CFTC S&P 500 NC Net Positions', time: '02:00', badge: 8, color: 'green' },
      { id: 17, country: 'EMU', countryCode: 'EMU', name: 'ECB\'s President Lagarde speech', time: '13:30', badge: 2, color: 'red' }
    ],
    '2025-11-23': []
  }

  const detailedEvents = [
    {
      id: 1,
      impact: 'Medium',
      country: 'US',
      name: 'UoM 5-year Consumer Inflation Expectation',
      time: '20:30',
      actual: '3.4%',
      actualColor: 'red',
      previous: '3.6%',
      forecast: '3.6%'
    },
    {
      id: 2,
      impact: 'Low',
      impactOutline: true,
      country: 'US',
      name: 'Wholesale Inventories',
      time: '20:30',
      actual: '0%',
      actualColor: 'green',
      previous: '-0.2%',
      forecast: '-0.2%'
    },
    {
      id: 3,
      impact: 'Medium',
      country: 'US',
      name: 'Michigan Consumer Expectations Index',
      time: '20:30',
      actual: '51',
      actualColor: 'green',
      previous: '49',
      forecast: '49'
    },
    {
      id: 4,
      impact: 'Medium',
      country: 'US',
      name: 'Michigan Consumer Sentiment Index',
      time: '20:30',
      actual: '51',
      actualColor: 'green',
      previous: '50.3',
      forecast: '50.5'
    },
    {
      id: 5,
      impact: 'Medium',
      country: 'US',
      name: 'UoM 1-year Consumer Inflation Expectations',
      time: '20:30',
      actual: '4.5%',
      actualColor: 'red',
      previous: '4.7%',
      forecast: '4.7%'
    },
    {
      id: 6,
      impact: 'Medium',
      country: 'GB',
      name: 'BoE\'s Pill speech',
      time: '21:10',
      actual: '-',
      previous: '-',
      forecast: '-'
    },
    {
      id: 7,
      impact: 'Low',
      impactOutline: true,
      country: 'US',
      name: 'Baker Hughes US Oil Rig Count',
      time: '23:30',
      timeUntil: '58m',
      previous: '417',
      forecast: '418',
      actual: '-'
    }
  ]

  const days = [
    { date: '2025-11-17', day: 'MON', dayNum: '17.11' },
    { date: '2025-11-18', day: 'TUE', dayNum: '18.11' },
    { date: '2025-11-19', day: 'WED', dayNum: '19.11' },
    { date: '2025-11-20', day: 'THU', dayNum: '20.11' },
    { date: '2025-11-21', day: 'FRI', dayNum: '21.11', isToday: true },
    { date: '2025-11-22', day: 'SAT', dayNum: '22.11' },
    { date: '2025-11-23', day: 'SUN', dayNum: '23.11' }
  ]

  const assetsWithTradeIdea = [
  { name: "EURAUD", flag: "🇦🇺" },
  { name: "EURJPY", flag: "🇯🇵" },
  { name: "EURSEK", flag: "🇸🇪" },
];

const allAssets = [
  { name: "EURUSD", flag: "🇺🇸" },
  { name: "EURCAD", flag: "🇨🇦" },
  { name: "EURCHF", flag: "🇨🇭" },
  { name: "EURGBP", flag: "🇬🇧" },
  { name: "EURNOK", flag: "🇳🇴" },
  { name: "EURNZD", flag: "🇳🇿" },
  { name: "EURPLN", flag: "🇵🇱" },
  { name: "EURSGD", flag: "🇸🇬" },
  { name: "DE40", flag: "🇩🇪" },
  { name: "EU50", flag: "🇪🇺" },
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

  const getBadgeColor = (color) => {
    if (color === 'green') return 'bg-green-500 border-green-500'
    if (color === 'red') return 'bg-red-500 border-red-500'
    return 'bg-gray-400 border-gray-400'
  }

  const getBorderColor = (color) => {
    if (color === 'green') return 'border-green-500'
    if (color === 'red') return 'border-red-500'
    return 'border-gray-400'
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-[95%] mx-auto">
        <h1 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '400' }}>
          Market Calendar
        </h1>

        {/* Filter and Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors" 
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600', color: '#000000' }}
            >
              FILTERS
            </button>
            <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400', color: '#000000' }}>
                NOV 17, 2025 - NOV 23, 2025
              </span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarType('ECONOMIC')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                calendarType === 'ECONOMIC'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
            >
              ECONOMIC
            </button>
            <button
              onClick={() => setCalendarType('CORPORATE')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                calendarType === 'CORPORATE'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '600' }}
            >
              CORPORATE
            </button>
          </div>
 
        </div>
        {/* Main Title */}
        <h2 className="mb-6 text-2xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '28px', color: '#000000', fontWeight: '700' }}>
          {calendarType === 'ECONOMIC' ? 'Economic Calendar' : 'Corporate Calendar'}
        </h2>

        {/* Calendar Grid View */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {days.map((day) => (
              <div key={day.date} className="flex flex-col min-w-[220px]">
                {/* Day Header */}
                <div className={`text-center mb-3 pb-2 ${day.isToday ? 'bg-blue-50 rounded' : ''}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-sm font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#000000', fontWeight: '600' }}>
                      {day.day}
                    </span>
                    {day.isToday && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
                    {day.dayNum}
                  </span>
                </div>

                {/* Events for this day */}
                <div className="space-y-2 min-h-[200px]">
                  {events[day.date] && events[day.date].length > 0 ? (
                    events[day.date].map((event) => (
                      <div
                        key={event.id}
                        className={`bg-white border-2 ${getBorderColor(event.color)} rounded-lg p-4 relative cursor-pointer hover:shadow-md transition-shadow min-h-[120px] flex flex-col items-center justify-center text-center`}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className={`absolute top-1 right-1 w-7 h-7 ${getBadgeColor(event.color)} text-white rounded-full flex items-center justify-center text-xs font-bold`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '700' }}>
                          {event.badge}
                        </div>
                        <div className="text-sm font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '13px', color: '#000000', fontWeight: '600' }}>
                          {event.countryCode}
                        </div>
                        <div className="text-sm font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', color: '#000000', fontWeight: '600' }}>
                          {event.name}
                        </div>
                        <div className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                          {event.time}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center h-20">
                      <span className="text-xs text-gray-400" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '400' }}>
                        NO EVENTS
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Events View for Selected Date */}
        {selectedDate === '2025-11-21' && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '600' }}>
              Friday 21.11
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {detailedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`min-w-[400px] bg-white border-2 ${
                    event.impactOutline ? 'border-green-500' : 'border-gray-300'
                  } rounded-lg p-6`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      event.impactOutline
                        ? 'border border-green-500 text-green-700 bg-white'
                        : 'bg-gray-200 text-gray-700'
                    }`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '600' }}>
                      {event.impact} Impact
                    </span>
                    <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center text-xs font-bold" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '11px', fontWeight: '700' }}>
                      {event.country}
                    </div>
                  </div>
                  <h4 className="font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#000000', fontWeight: '600' }}>
                    {event.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
                      {event.time}
                    </span>
                    {event.timeUntil && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {event.timeUntil}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>Actual</span>
                      <span className={`font-semibold ${event.actualColor === 'red' ? 'text-red-600' : event.actualColor === 'green' ? 'text-green-600' : 'text-gray-700'}`} style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '600' }}>
                        {event.actual}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>Previous</span>
                      <span className="font-semibold text-gray-700" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '600' }}>
                        {event.previous}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>Forecast</span>
                      <span className="font-semibold text-gray-700" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '600' }}>
                        {event.forecast}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event Details Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Retail Sales (MoM)
          </h2>

          {/* Description */}
          <p className="text-gray-700 text-sm md:text-base mt-3 leading-relaxed max-w-4xl">
            The Retail Sales released by <span className="underline cursor-pointer">INEGI</span>
            measures the total receipts of retail stores. Monthly percent changes reflect
            the rate of changes of such sales. Changes in retail sales are widely followed
            as an indicator of consumer spending. Generally speaking, a high reading is
            seen as positive or bullish for the Mexican peso, while a low reading is seen
            as negative or bearish.
          </p>

          {/* Divider */}
          <div className="border-t border-gray-300 my-6"></div>

          {/* Assets Section */}
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
            What Assets does this event affect?
          </h3>

          <p className="font-medium text-gray-800 mt-3 flex items-center gap-2">
            <span className="text-lg">⚡</span> Assets with a Trade Idea
          </p>

          {/* Asset Chip */}
          <div className="flex flex-wrap gap-3 mt-4">
            <button className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-full font-medium text-sm hover:scale-[1.03] transition">
              <img
                src="/flags/usdmxn.png"
                alt="USD/MXN"
                className="w-6 h-6 rounded-full object-cover"
              />
              USDMXN
            </button>
          </div>
        </div>

        <MarketChartSection />

        {/* Trade Idea Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
            Trade Idea
          </h2>

          {/* Tag */}
          <span className="inline-block bg-green-600 text-white text-sm font-semibold px-4 py-1 rounded-full mb-4">
            BUY LIMIT
          </span>

          {/* Date info */}
          <div className="text-gray-600 text-sm mb-6">
            <p>Published at: 25/11/2025 11:10</p>
            <p>Expires at: 26/11/2025 11:30</p>
          </div>

          {/* Description */}
          <div className="text-gray-800 space-y-3 text-sm md:text-base">
            <p>Price action looks to be forming a bottom</p>
            <p>Pivot support is at 18.3000</p>
            <p>Risk/Reward would be poor to call a buy from current levels</p>
            <p>A move through 18.5500 will confirm the bullish momentum</p>
            <p>The measured move target is 18.6500</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 my-6"></div>

          {/* Resistance & Support Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Resistance List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-green-700 font-semibold">
                  <span className="text-xl mr-2">|</span> RESISTANCE 1
                </span>
                <span className="text-lg font-bold text-gray-900">18.55000</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center text-green-700 font-semibold">
                  <span className="text-xl mr-2">|</span> RESISTANCE 2
                </span>
                <span className="text-lg font-bold text-gray-900">18.60000</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center text-green-700 font-semibold">
                  <span className="text-xl mr-2">|</span> RESISTANCE 3
                </span>
                <span className="text-lg font-bold text-gray-900">18.65000</span>
              </div>
            </div>

            {/* Support List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-red-700 font-semibold">
                  <span className="text-xl mr-2 text-red-700">|</span> SUPPORT 1
                </span>
                <span className="text-lg font-bold text-gray-900">18.45000</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center text-red-700 font-semibold">
                  <span className="text-xl mr-2 text-red-700">|</span> SUPPORT 2
                </span>
                <span className="text-lg font-bold text-gray-900">18.40000</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center text-red-700 font-semibold">
                  <span className="text-xl mr-2 text-red-700">|</span> SUPPORT 3
                </span>
                <span className="text-lg font-bold text-gray-900">18.37500</span>
              </div>
            </div>

            {/* Empty third column for alignment on desktop */}
            <div className="hidden lg:block"></div>
          </div>
        </div>

        <TradeIdeaPerformance />

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

        <NewsSentiment />

      </div>

      {/* Filter Modal - Same as other pages */}
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

export default MarketCalendar
