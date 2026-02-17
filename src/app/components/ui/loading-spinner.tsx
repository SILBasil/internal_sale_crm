import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center p-4 ${className || ""}`}>
            <Loader2
                className="animate-spin text-blue-600"
                size={size}
            />
        </div>
    );
}
