import { User } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'

function UserProfile() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <PageHeader
            icon={User}
            title="User Profile"
            subtitle="Manage your profile information and account settings."
          />

          <div className="bg-white rounded-lg shadow-lg p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfile

