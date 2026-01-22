import React, { useState } from 'react';
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
import { 
  Calendar as CalendarIcon, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Info,
  ArrowRight,
  BarChart2,
  Globe,
  Newspaper
} from 'lucide-react';
import TradingViewWidget from './TradingViewWidget';
import PageHeader from '../../components/PageHeader';

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
    <div className="w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
      {/* Top Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Left Side */}
        <div className="flex items-start gap-4">
          {/* Flags */}
          <div className="flex flex-col items-center">
            <img
              src="/flag-icon.svg"
              alt="flags"
              className="w-14 h-14 object-cover rounded-xl shadow-sm"
            />
          </div>

          {/* Pair Info */}
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium">
                USD/MXN
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
                BUY LIMIT
              </span>
            </div>

            <h2 className="text-3xl font-bold mt-2 text-slate-900">USDMXN</h2>

            {/* Entry/Target/Stop */}
            <div className="flex flex-wrap gap-8 mt-4 text-center">
              <div>
                <p className="text-emerald-600 text-xl font-bold">18.45000</p>
                <p className="text-slate-500 text-sm">Entry</p>
              </div>

              <div>
                <p className="text-emerald-600 text-xl font-bold">18.60000</p>
                <p className="text-slate-500 text-sm">Target</p>
              </div>

              <div>
                <p className="text-red-500 text-xl font-bold">18.37500</p>
                <p className="text-slate-500 text-sm">Stop</p>
              </div>

              <div>
                <p className="text-slate-900 text-xl font-bold">Intraday</p>
                <p className="text-slate-500 text-sm">Duration</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center gap-1 items-end h-5">
                  <div className="w-1.5 h-3 bg-slate-300 rounded-full"></div>
                  <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                  <div className="w-1.5 h-5 bg-slate-800 rounded-full"></div>
                  <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                </div>
                <p className="text-slate-500 text-sm mt-1">Confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="text-right">
          <p className="text-4xl font-bold text-slate-900">18.47099</p>
          <p className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
            <TrendingUp className="w-4 h-4" /> 0.00686 (+0.04%)
          </p>
        </div>
      </div>

      {/* Chart Title */}
      <h3 className="text-xl font-bold mt-10 mb-4 text-slate-900 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-slate-500" />
        Market Chart (4H)
      </h3>

      {/* Toolbar */}
      <div className="flex items-center gap-4 text-slate-600 font-medium text-sm border-b border-slate-100 pb-2 overflow-x-auto">
        <button className="text-slate-900 font-bold px-3 py-1 bg-slate-100 rounded-lg">4h</button>
        <button className="px-3 py-1 hover:bg-slate-50 rounded-lg transition-colors">Indicators</button>
        <div className="flex-1"></div>
        <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
        <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* TradingView Chart */}
      <div className="w-full h-[450px] mt-4 rounded-xl overflow-hidden border border-slate-100">
        <TradingViewWidget />
      </div>
    </div>
  );
}

function TradeIdeaPerformance() {
  const [activeTab, setActiveTab] = useState("recent");

  const labels = [
    "Oct 2025", "Oct 2025", "Nov 2025", "Nov 2025", "Nov 2025", "Nov 2025", "Nov 2025",
  ];

  const pricePoints = [1000, 998, 1005, 1012, 1003, 999, 1008, 995];
  const markerColors = ["#ef4444", "#10b981", "#10b981", "#ef4444", "#ef4444", "#ef4444", "#10b981", "#ef4444"];

  const data = {
    labels,
    datasets: [
      {
        label: "Equity",
        data: pricePoints,
        borderColor: "#1e293b",
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        labels: "Trades",
        data: pricePoints,
        pointBackgroundColor: markerColors,
        pointBorderColor: markerColors,
        pointRadius: 6,
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
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: "#1e293b",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        grid: { display: true, color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11 }, color: "#64748b" },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#64748b" },
        border: { display: false },
      },
    },
  };

  return (
    <div className="w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Trade Idea Performance</h2>
        
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "recent"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setActiveTab("monthly")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="w-full h-[300px] mt-6">
        <Line data={data} options={options} />
      </div>

      <div className="flex flex-wrap gap-6 text-sm mt-6 justify-center">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> 
          <span className="text-slate-600">Winning Trade</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500 rounded-full"></span> 
          <span className="text-slate-600">Losing Trade</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-teal-500 rounded-full"></span> 
          <span className="text-slate-600">Live Trade</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-0.5 bg-slate-800 rounded-full"></span> 
          <span className="text-slate-600">Equity</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-xs text-slate-500 leading-relaxed text-center">
          The equity curve is based on the last 10 trade ideas using a nominal 1000 starting balance, risking 1% per trade. This is for illustration only and may not suit all investors. Past performance does not guarantee future results.
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-600" />
          Performance Stats <span className="text-slate-400 font-normal text-sm ml-2">(Total Trades: 217)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-slate-500 text-sm">Win Rate</span>
            <span className="text-slate-900 font-bold">51.61%</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-slate-500 text-sm">Avg Duration</span>
            <span className="text-slate-900 font-bold">12.79h</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-slate-500 text-sm">Avg Outcome</span>
            <span className="text-emerald-600 font-bold">+0.45%</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-slate-500 text-sm">Best Trade</span>
            <span className="text-emerald-600 font-bold">+8.23%</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-slate-500 text-sm">Worst Trade</span>
            <span className="text-red-500 font-bold">-4.56%</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-slate-500 text-sm">Max Drawdown</span>
            <span className="text-red-500 font-bold">-12.34%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewsSentiment() {
  const labels = ["27.10", "30.10", "04.11", "07.11", "12.11", "17.11", "20.11"];

  const data = {
    labels,
    datasets: [
      {
        label: "Price",
        data: [1.775, 1.768, 1.764, 1.781, 1.773, 1.789, 1.782],
        borderColor: "#1e293b",
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: "Sentiment",
        data: [0.2, -0.3, -0.6, 0.1, -0.2, -0.5, 0.3],
        backgroundColor: (ctx) => {
          const value = ctx.raw;
          return value >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)";
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 0,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 },
          color: '#64748b'
        },
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
        border: { display: false },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        grid: { color: "rgba(0,0,0,0.05)", drawBorder: false },
        ticks: { color: "#94a3b8", font: { size: 11 } },
        border: { display: false },
      },
      y1: {
        type: 'linear',
        display: false,
        position: 'right',
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="w-full bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 mt-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-blue-600" />
        News Sentiment
      </h2>

      <div className="w-full h-[300px] md:h-[400px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

function MarketCalendar() {
  const [calendarType, setCalendarType] = useState('ECONOMIC');
  const [selectedDate, setSelectedDate] = useState('2025-11-21');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

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
  };

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
  ];

  const days = [
    { date: '2025-11-17', day: 'MON', dayNum: '17.11' },
    { date: '2025-11-18', day: 'TUE', dayNum: '18.11' },
    { date: '2025-11-19', day: 'WED', dayNum: '19.11' },
    { date: '2025-11-20', day: 'THU', dayNum: '20.11' },
    { date: '2025-11-21', day: 'FRI', dayNum: '21.11', isToday: true },
    { date: '2025-11-22', day: 'SAT', dayNum: '22.11' },
    { date: '2025-11-23', day: 'SUN', dayNum: '23.11' }
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
    if (color === 'green') return 'bg-emerald-500 border-emerald-500 shadow-emerald-200';
    if (color === 'red') return 'bg-red-500 border-red-500 shadow-red-200';
    return 'bg-slate-400 border-slate-400 shadow-slate-200';
  };

  const getBorderColor = (color) => {
    if (color === 'green') return 'border-emerald-200 hover:border-emerald-300';
    if (color === 'red') return 'border-red-200 hover:border-red-300';
    return 'border-slate-200 hover:border-slate-300';
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Market Calendar" 
        subtitle="Stay ahead of market-moving events and economic indicators"
        icon={CalendarIcon}
      />

        
        {/* Filter and Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-sm font-medium text-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm font-medium text-sm">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span>NOV 17, 2025 - NOV 23, 2025</span>
            </div>
          </div>

          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
            <button
              onClick={() => setCalendarType('ECONOMIC')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                calendarType === 'ECONOMIC'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Economic
            </button>
            <button
              onClick={() => setCalendarType('CORPORATE')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                calendarType === 'CORPORATE'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Corporate
            </button>
          </div>
        </div>

        {/* Calendar Grid View */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {days.map((day) => (
              <div key={day.date} className="flex flex-col min-w-[200px] flex-1">
                {/* Day Header */}
                <div className={`text-center mb-4 pb-3 border-b border-slate-100 ${day.isToday ? 'bg-blue-50/50 rounded-xl -mx-2 px-2 pt-2' : ''}`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className={`text-sm font-bold ${day.isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                      {day.day}
                    </span>
                    {day.isToday && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${day.isToday ? 'text-blue-600' : 'text-slate-500'}`}>
                    {day.dayNum}
                  </span>
                </div>

                {/* Events for this day */}
                <div className="space-y-3 min-h-[200px]">
                  {events[day.date] && events[day.date].length > 0 ? (
                    events[day.date].map((event) => (
                      <div
                        key={event.id}
                        className={`bg-white border ${getBorderColor(event.color)} rounded-xl p-4 relative cursor-pointer hover:shadow-md transition-all group min-h-[120px] flex flex-col items-center justify-center text-center`}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className={`absolute top-2 right-2 w-6 h-6 ${getBadgeColor(event.color)} text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm group-hover:scale-110 transition-transform`}>
                          {event.badge}
                        </div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                          {event.countryCode}
                        </div>
                        <div className="text-sm font-semibold mb-2 text-slate-800 line-clamp-2">
                          {event.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md mt-auto">
                          <Clock className="w-3 h-3" />
                          {event.time}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center h-24 border-dashed">
                      <span className="text-xs text-slate-400 font-medium">
                        No Events
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="mb-6 text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Friday, Nov 21
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
              {detailedEvents.map((event) => (
                <div
                  key={event.id}
                  className={`min-w-[320px] md:min-w-[400px] bg-white border ${
                    event.impactOutline ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  } rounded-xl p-5 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      event.impactOutline
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {event.impact} Impact
                    </span>
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-xs font-bold text-blue-700">
                      {event.country}
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-base">
                    {event.name}
                  </h4>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </span>
                    {event.timeUntil && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                        <Clock className="w-3 h-3" />
                        in {event.timeUntil}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3">
                    <div className="text-center">
                      <span className="text-xs text-slate-400 block mb-1">Actual</span>
                      <span className={`text-sm font-bold ${event.actualColor === 'red' ? 'text-red-500' : event.actualColor === 'green' ? 'text-emerald-500' : 'text-slate-700'}`}>
                        {event.actual}
                      </span>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <span className="text-xs text-slate-400 block mb-1">Previous</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {event.previous}
                      </span>
                    </div>
                    <div className="text-center border-l border-slate-200">
                      <span className="text-xs text-slate-400 block mb-1">Forecast</span>
                      <span className="text-sm font-semibold text-slate-700">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              Retail Sales (MoM)
              <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">MXN Event</span>
            </h2>

            {/* Description */}
            <p className="text-slate-600 mt-4 leading-relaxed">
              The Retail Sales released by <span className="font-semibold text-blue-600 cursor-pointer hover:underline">INEGI</span> measures the total receipts of retail stores. Monthly percent changes reflect the rate of changes of such sales. Changes in retail sales are widely followed as an indicator of consumer spending. Generally speaking, a high reading is seen as positive or bullish for the Mexican peso, while a low reading is seen as negative or bearish.
            </p>

            {/* Divider */}
            <div className="border-t border-slate-100 my-8"></div>

            {/* Assets Section */}
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Impacted Assets
            </h3>

            {/* Asset Chip */}
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-3 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all py-2 px-4 rounded-xl group">
                <img
                  src="/flags/usdmxn.png"
                  alt="USD/MXN"
                  className="w-8 h-8 rounded-full object-cover shadow-sm"
                  onError={(e) => {e.target.src = "https://flagcdn.com/w40/mx.png"}} // Fallback
                />
                <div className="text-left">
                  <span className="block text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">USDMXN</span>
                  <span className="block text-xs text-emerald-500 font-medium">High Impact</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Trade Idea
            </h2>

            {/* Tag */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold px-4 py-1.5 rounded-full">
                <TrendingUp className="w-4 h-4" />
                BUY LIMIT
              </span>
            </div>

            {/* Date info */}
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Published</span>
                <span className="font-medium text-slate-900">25/11/2025 11:10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expires</span>
                <span className="font-medium text-slate-900">26/11/2025 11:30</span>
              </div>
            </div>

            {/* Description */}
            <div className="text-slate-700 space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                Price action looks to be forming a bottom
              </p>
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                Pivot support is at 18.3000
              </p>
              <p className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                Risk/Reward would be poor to call a buy from current levels
              </p>
            </div>
          </div>
        </div>

        <MarketChartSection />

        {/* Support & Resistance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Support & Resistance Levels</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Resistance List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="flex items-center text-emerald-700 font-bold text-sm">
                  RESISTANCE 1
                </span>
                <span className="text-base font-bold text-slate-900">18.55000</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="flex items-center text-emerald-700 font-bold text-sm">
                  RESISTANCE 2
                </span>
                <span className="text-base font-bold text-slate-900">18.60000</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="flex items-center text-emerald-700 font-bold text-sm">
                  RESISTANCE 3
                </span>
                <span className="text-base font-bold text-slate-900">18.65000</span>
              </div>
            </div>

            {/* Support List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <span className="flex items-center text-red-700 font-bold text-sm">
                  SUPPORT 1
                </span>
                <span className="text-base font-bold text-slate-900">18.45000</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <span className="flex items-center text-red-700 font-bold text-sm">
                  SUPPORT 2
                </span>
                <span className="text-base font-bold text-slate-900">18.40000</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <span className="flex items-center text-red-700 font-bold text-sm">
                  SUPPORT 3
                </span>
                <span className="text-base font-bold text-slate-900">18.37500</span>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
               <div>
                 <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                 <p className="text-sm text-slate-500">
                   These levels are calculated based on recent price action and volatility. Use them as potential entry/exit points.
                 </p>
               </div>
            </div>
          </div>
        </div>

        <TradeIdeaPerformance />

        {/* News & Insights */}
         <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  News & Insights
                </h3>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                  EURJPY
                </span>
              </div>

              <div className="grid gap-6">
                {newsInsights.map((item) => (
                  <div key={item.id} className="group border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                        {item.date}
                      </span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-[25%] shrink-0">
                        <div className="aspect-video md:aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.image} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            onError={(e) => {e.target.src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=60"}}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-3 text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                          {item.description}
                        </p>
                        {item.tags && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {item.tags.map((tag, idx) => (
                              <span key={idx} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.partialText && (
                          <p className="text-xs text-slate-500 italic mb-3 pl-3 border-l-2 border-slate-200">
                            "{item.partialText}..."
                          </p>
                        )}
                        <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group/btn">
                          Read Full Article
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

        <NewsSentiment />


      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Filter Calendar</h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
            </div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Filters Coming Soon</h4>
              <p className="text-slate-500">
                Advanced filtering options for countries, impact levels, and categories will be available shortly.
              </p>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="mt-6 px-6 py-2 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketCalendar;