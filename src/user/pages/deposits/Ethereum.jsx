import { Link } from 'react-router-dom'
import { useState } from 'react'

function Ethereum() {
  const [selectedAccount, setSelectedAccount] = useState('account1')
  const [amount, setAmount] = useState('0.00')

  return (
    <div className="w-full max-w-8xl mx-auto ">
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6">

        {/* LEFT-ALIGNED HEADER + OFFER AREA */}
        <div className="w-full max-w-3xl">

          {/* HEADER */}
          <div className="mb-6">
            <Link
              to="/user/deposits"
              className="inline-flex items-center text-[#00A896] hover:text-[#008f7a] mb-2 block"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>

            <h1
              style={{ fontFamily: 'Roboto, sans-serif', fontSize: '26px', color: '#000', fontWeight: '400' }}
            >
              Deposit with Ethereum
            </h1>
          </div>


          {/* OFFER BANNER (LEFT ALIGNED) */}
          <div className="bg-[#00A896] text-white rounded-lg px-5 py-4 mb-6 flex items-center shadow-sm">
            <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <p className="text-sm leading-snug" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Deposit $100 or more to receive a complimentary 30% bonus credit
            </p>
          </div>
        </div>



        {/* ACCOUNT SELECT */}
        <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200 shadow-sm">
          <h2 className="mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: '400' }}>
            Deposit to account
          </h2>

          <p className="text-gray-600 mb-4 text-sm">
            Choose a trading account or wallet for your deposit your money
          </p>

          <div className="space-y-4">

            {/* ACCOUNT 1 */}
            <div
              onClick={() => setSelectedAccount('account1')}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAccount === 'account1'
                ? 'border-[#00A896] bg-gray-50'
                : 'border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      USD
                    </span>
                    <span className="text-lg" style={{ fontFamily: 'Roboto' }}>1013516260</span>
                  </div>

                  <p className="text-gray-600 text-sm">MT5 Standard</p>
                  <p className="text-gray-600 text-sm">Balance: USD 0.00</p>
                </div>

                {selectedAccount === 'account1' ? (
                  <svg className="w-6 h-6 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
            </div>

            {/* ACCOUNT 2 */}
            <div
              onClick={() => setSelectedAccount('account2')}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedAccount === 'account2'
                ? 'border-[#00A896] bg-gray-50'
                : 'border-gray-300'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      USD
                    </span>
                    <span className="text-lg" style={{ fontFamily: 'Roboto' }}>W-2337894-001</span>
                  </div>

                  <p className="text-gray-600 text-sm">Wallet</p>
                  <p className="text-gray-600 text-sm">Balance: USD 0.00</p>
                </div>

                {selectedAccount === 'account2' ? (
                  <svg className="w-6 h-6 text-[#00A896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* DEPOSIT AMOUNT */}
        <div className="bg-white rounded-lg p-5 mb-6 border border-gray-200 shadow-sm">
          <h2 className="mb-1" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', fontWeight: '400' }}>
            Deposit amount
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            Transaction limit: USD 10 - USD 20000
          </p>

          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden mb-5">
            <div className="flex items-center px-3 py-2 border-r border-gray-300 bg-gray-50">
              <span className="mr-2 text-sm">USD</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-4 py-2 outline-none text-lg"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setAmount('100')}
              className="py-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              USD 100
            </button>

            <button
              onClick={() => setAmount('150')}
              className="py-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              USD 150
            </button>

            <button
              onClick={() => setAmount('200')}
              className="py-3 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              USD 200
            </button>
          </div>
        </div>

        {/* ETHEREUM BUTTON (CENTERED FULL WIDTH) */}
        <div className="flex justify-center"  >
          <button className="max-w-4xl w-full bg-blue-600 text-dark-base py-4 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-all font-semibold">
            <img src="/ethereum.svg" alt="Ethereum" className="w-6 h-6 mr-2" />
            Continue with Ethereum
          </button>
        </div>
      </div>
    </div>
  )
}

export default Ethereum

