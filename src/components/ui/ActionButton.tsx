import React from 'react';

export type ActionButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'success';

export type ActionButtonSize = 'sm' | 'md' | 'lg';

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  tooltip?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  tooltip,
  className = '',
  disabled,
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs space-x-1.5',
    md: 'px-3.5 py-1.5 text-xs space-x-2',
    lg: 'px-4 py-2 text-sm space-x-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-xs border border-blue-700',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-700 shadow-xs border border-slate-900',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-xs border border-rose-700',
    outline:
      'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 focus:ring-slate-400 shadow-xs',
    ghost:
      'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-300 border border-transparent',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-xs border border-emerald-700',
  }[variant];

  return (
    <button
      type="button"
      title={tooltip}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      {...rest}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {!isLoading && Icon && iconPosition === 'left' && (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      )}

      {children && <span>{children}</span>}

      {!isLoading && Icon && iconPosition === 'right' && (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      )}
    </button>
  );
};
