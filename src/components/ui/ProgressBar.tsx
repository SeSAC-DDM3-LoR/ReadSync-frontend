
import { cn } from './Card';

interface ProgressBarProps {
    value: number;
    max: number;
    className?: string;
    label?: string;
}

export function ProgressBar({ value, max, className, label }: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={cn("w-full", className)}>
            {label && (
                <div className="flex justify-between text-xs mb-1 font-medium text-forest-700">
                    <span>{label}</span>
                    <span>{value} / {max}</span>
                </div>
            )}
            <div className="h-2.5 w-full bg-forest-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-forest-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
