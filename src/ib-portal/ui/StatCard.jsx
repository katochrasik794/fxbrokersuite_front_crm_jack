import React from 'react';
import Card from './Card';

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  valueColor = 'text-gray-900',
  className = '',
  iconBg = 'bg-ib-100',
  onClick
}) {
  return (
    <Card className={`relative overflow-hidden ${className}`} hover onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${valueColor} mb-1`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>
            <Icon className="w-6 h-6 text-ib-600" />
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;

