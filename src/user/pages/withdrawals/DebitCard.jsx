import React from 'react';
import PageHeader from '../../components/PageHeader';
import { CreditCard, AlertCircle } from 'lucide-react';

function DebitCard() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Withdraw via Card" 
        subtitle="Withdraw funds to your debit or credit card"
        icon={CreditCard}
      />

      {/* Card Logos and Information */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          
          {/* Card Logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8 p-6 bg-gray-50/50 rounded-xl border border-gray-100">
            {/* VISA */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-14 bg-blue-600 rounded-lg shadow-sm flex items-center justify-center transform hover:scale-105 transition-transform">
                <span className="text-white font-bold text-2xl tracking-wider">VISA</span>
              </div>
            </div>
            
            {/* Mastercard */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-14 bg-gray-800 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-center -space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full opacity-90"></div>
                  <div className="w-8 h-8 bg-orange-400 rounded-full opacity-90"></div>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mastercard</span>
            </div>
            
            {/* Maestro */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-14 bg-gray-800 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-center -space-x-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full opacity-90"></div>
                  <div className="w-8 h-8 bg-blue-500 rounded-full opacity-90"></div>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Maestro</span>
            </div>
          </div>

          {/* Information Text */}
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex gap-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm leading-relaxed">
                <p>
                  <span className="font-semibold">Return to Source Policy:</span> fxbrokersuite follows a strict return to source policy. In all instances where applicable, all monies paid out by fxbrokersuite will be paid back to the source from where they originated.
                </p>
                <p>
                  To make a withdrawal to a card, a deposit must first be made from that card and the details must be saved on this platform.
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default DebitCard;
