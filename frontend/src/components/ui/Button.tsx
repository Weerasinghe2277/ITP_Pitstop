// frontend/src/components/ui/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  variant = 'default',
                                                  className = '',
                                                  ...props
                                              }) => {
    const variantStyles = {
        default: 'bg-blue-600 text-white hover:bg-blue-700',
        outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50',
        ghost: 'text-blue-600 hover:bg-blue-50',
    };

    return (
        <button
            className={`px-4 py-2 rounded-md font-medium transition-colors ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};