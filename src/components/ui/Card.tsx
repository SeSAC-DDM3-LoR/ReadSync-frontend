import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "bg-white rounded-2xl shadow-soft border border-forest-50 p-6 transition-all duration-300",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: CardProps) {
    return <div className={cn("flex flex-col space-y-1.5 mb-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("font-bold font-serif text-lg text-forest-800 flex items-center gap-2", className)} {...props} />;
}
