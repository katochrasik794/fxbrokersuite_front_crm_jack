import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import ibService from '../../../services/ibService';
import {
  Calculator,
  Info,
  Clock,
} from 'lucide-react';

function PipCalculator() {
  const [symbols, setSymbols] = useState([]);
  const [groups, setGroups] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [pips, setPips] = useState('10');
  const [lots, setLots] = useState('1');
  const [calculationResult, setCalculationResult] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(true);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await ibService.getDashboardStats();
        if (res.success) {
          setGroups(res.data.stats.groups || []);
          // Use top symbols or all symbols if available
          const syms = res.data.stats.groups?.[0]?.symbols || ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'];
          setSymbols(syms.map(s => ({ value: s, label: s })));
        }
      } catch (error) {
        console.error('Error fetching pip calculator data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate pip value when inputs change
  useEffect(() => {
    if (symbol && pips && lots) {
      const pipsNum = parseFloat(pips) || 0;
      const lotsNum = parseFloat(lots) || 0;

      // Standard pip value calculation (simplified)
      let pipValuePerLot = 10;
      if (symbol.includes('XAU') || symbol.includes('GOLD')) pipValuePerLot = 1;
      else if (symbol.includes('BTC') || symbol.includes('ETH')) pipValuePerLot = 1;
      else if (symbol.includes('JPY')) pipValuePerLot = 10 / 1.1; // Dummy JPY adjustment

      const estimatedPipValue = pipValuePerLot * pipsNum * lotsNum;

      // Get IB Rate from groups (find group that contains the symbol or just use default)
      const group = groups.find(g => g.symbols?.includes(symbol)) || groups[0];
      const ibRate = parseFloat(group?.rate || 0);
      const commissionPreview = ibRate * lotsNum;

      setCalculationResult({
        symbol,
        lots: lotsNum.toFixed(2),
        pips: pipsNum.toFixed(1),
        ibRate: `$${ibRate.toFixed(2)}/Lot`,
        commissionPreview: `$${commissionPreview.toFixed(2)}`,
        pipValuePerLot: `$${pipValuePerLot.toFixed(2)}`,
        estimatedPipValue: `$${estimatedPipValue.toFixed(2)}`,
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } else {
      setCalculationResult(null);
    }
  }, [symbol, pips, lots, groups]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ib-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-6 h-6 text-ib-600" />
          <h1 className="text-3xl font-bold text-gray-900">Pip Calculator</h1>
        </div>
        <p className="text-gray-600">Calculate pip values and commission for your trading pairs</p>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Input Parameters</h2>
          <div className="space-y-4">
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 outline-none transition-colors"
              >
                <option value="">Select Symbol</option>
                {symbols.map((sym) => (
                  <option key={sym.value} value={sym.value}>{sym.label}</option>
                ))}
              </select>
            </div>

            {/* Account Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Currency</label>
              <select
                value={accountCurrency}
                onChange={(e) => setAccountCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 outline-none transition-colors"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            {/* Pips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pips</label>
              <input
                type="number"
                value={pips}
                onChange={(e) => setPips(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 outline-none transition-colors"
                placeholder="Enter pips"
              />
            </div>

            {/* Lots */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lots</label>
              <input
                type="number"
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ib-500 outline-none transition-colors"
                placeholder="Enter lots"
              />
            </div>
          </div>
        </Card>

        {/* Middle: Estimated Pip Value Display */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estimated Pip Value</h2>

          {calculationResult ? (
            <div className="space-y-4">
              <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-2">Estimated Pip Value</p>
                <p className="text-4xl font-bold text-blue-600">{calculationResult.estimatedPipValue}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Symbol:</span>
                  <span className="text-sm font-semibold text-gray-900">{calculationResult.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lots:</span>
                  <span className="text-sm font-semibold text-gray-900">{calculationResult.lots}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pips:</span>
                  <span className="text-sm font-semibold text-gray-900">{calculationResult.pips}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Your IB Rate:</span>
                  <span className="text-sm font-semibold text-green-600">{calculationResult.ibRate}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission Preview:</span>
                  <span className="text-sm font-semibold text-green-600">{calculationResult.commissionPreview}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Pip Value / Lot:</span>
                  <span className="text-sm font-bold text-gray-900">{calculationResult.pipValuePerLot}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Calculated at {lastUpdated} • Base {accountCurrency}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Fill in the form to see calculations</p>
            </div>
          )}
        </Card>

        {/* Right: Notes */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          </div>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-ib-600 mt-1">•</span>
              <span>Pip values are estimated based on standard configurations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ib-600 mt-1">•</span>
              <span>Your IB rate reflects your current commission per lot for the selected account group.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ib-600 mt-1">•</span>
              <span>Live trading results may vary based on market volatility and spreads.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

export default PipCalculator;
