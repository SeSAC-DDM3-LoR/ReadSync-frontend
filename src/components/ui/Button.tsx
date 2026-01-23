import React from 'react';
import { cn } from './Card';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
    const variants = {
        primary: 'bg-forest-500 text-white hover:bg-forest-600 shadow-md hover:shadow-lg',
        secondary: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
        outline: 'border border-forest-200 bg-white hover:bg-forest-50 text-forest-700 hover:border-forest-300',
        ghost: 'hover:bg-forest-50 text-forest-600',
    };

    const sizes = {
        sm: 'h-9 px-4 text-xs font-medium',
        md: 'h-11 px-6 py-2',
        lg: 'h-14 px-8 text-lg',
    };

    return (
        <button
            className={cn(
                "inline-flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none disabled:opacity-50 active:scale-95",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    );
}
