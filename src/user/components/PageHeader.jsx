/**
 * Reusable Page Header Component
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Icon component from lucide-react
 * @param {string} props.title - Page title (will be uppercase)
 * @param {string} props.subtitle - Page subtitle/description
 */
export default function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Icon size={20} className="text-dark-base" />
          </div>
        )}
        <h1 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="text-gray-600 text-sm ml-[52px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

