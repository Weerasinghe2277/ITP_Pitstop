// frontend/src/components/ui/Card.tsx
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    // Add any specific props for Card if needed
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    // Add any specific props for CardHeader if needed
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
    // Add any specific props for CardTitle if needed
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    // Add any specific props for CardContent if needed
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
    <div
        className={`border rounded-lg bg-white shadow-sm transition-shadow ${className}`}
        {...props}
    >
        {children}
    </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...props }) => (
    <div className={`px-6 py-4 border-b ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', ...props }) => (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
        {children}
    </h3>
);

export const CardContent: React.FC<CardContentProps> = ({ children, className = '', ...props }) => (
    <div className={`px-6 py-4 ${className}`} {...props}>
        {children}
    </div>
);