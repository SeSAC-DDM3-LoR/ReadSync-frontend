import React from 'react';
import { Header } from './Header';
import { cn } from '../ui/Card';

export function MainLayout({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className="min-h-screen bg-forest-50 font-sans selection:bg-forest-200 selection:text-forest-900">
            <Header />
            <main
                className={cn(
                    "pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto w-full h-full min-h-[calc(100vh-64px)]",
                    className
                )}
            >
                {children}
            </main>
        </div>
    );
}
