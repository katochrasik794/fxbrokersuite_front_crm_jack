import React from 'react';
import PageHeader from '../../components/PageHeader';
import { Wallet, Info } from 'lucide-react';

function Skrill() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Withdraw via Skrill" 
        subtitle="Fast and secure withdrawals to your Skrill account"
        icon={Wallet}
      />

      {/* Skrill Information Panel */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          
          {/* Skrill Logo Container */}
          <div className="bg-gray-50 rounded-xl p-8 mb-8 flex items-center justify-center border border-gray-100 max-w-sm mx-auto">
            <img 
              src="/Skrill_logo.png.webp" 
              alt="Skrill" 
              className="h-16 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="hidden text-2xl font-bold text-gray-700">Skrill</span>
          </div>
          
          <div className="flex gap-4 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-left">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              You did not deposit funds using Skrill. Skrill withdrawals are only available to accounts that were previously used for deposits.
            </p>
          </div>
      </div>
    </div>
  );
}

export default Skrill;
