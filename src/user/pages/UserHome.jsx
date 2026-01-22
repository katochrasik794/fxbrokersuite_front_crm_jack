import { LayoutDashboard, User, Wallet } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { Link } from 'react-router-dom'

function UserHome() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="User Home"
        subtitle="Welcome to your personal trading dashboard."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/user/profile" className="group">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <User size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Profile Settings</h3>
            <p className="text-sm text-gray-500">Manage your personal information, security settings, and preferences.</p>
          </div>
        </Link>

        <Link to="/user/dashboard" className="group">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <LayoutDashboard size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Trading Dashboard</h3>
            <p className="text-sm text-gray-500">View your accounts, monitor performance, and access trading tools.</p>
          </div>
        </Link>

        <Link to="/user/deposits" className="group">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <Wallet size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">Funds Management</h3>
            <p className="text-sm text-gray-500">Deposit funds, request withdrawals, and view transaction history.</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default UserHome
