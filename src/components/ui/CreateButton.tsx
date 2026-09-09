import React from 'react';
import { Plus } from 'lucide-react';
import { ActionButton, type ActionButtonSize } from './ActionButton.js';

export interface CreateButtonProps {
  id?: string;
  label?: string;
  onClick: () => void;
  size?: ActionButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  tooltip?: string;
}

export const CreateButton: React.FC<CreateButtonProps> = ({
  id,
  label = 'Adicionar',
  onClick,
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  tooltip,
}) => {
  return (
    <ActionButton
      id={id}
      variant="primary"
      size={size}
      icon={Plus}
      iconPosition="left"
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      tooltip={tooltip || label}
      className={className}
      aria-label={label}
    >
      {label}
    </ActionButton>
  );
};
