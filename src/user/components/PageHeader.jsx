/**
 * Reusable Page Header Component
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icon component from lucide-react
 * @param {string} props.title - Page title (will be uppercase)
 * @param {string} props.subtitle - Page subtitle/description
 */
export default function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-3">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/20 flex items-center justify-center flex-shrink-0 text-white">
            <Icon size={24} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

