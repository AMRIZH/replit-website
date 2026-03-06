import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  error: any;
  className?: string;
}

export function ErrorDisplay({ error, className = "" }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className={`bg-destructive/5 border border-destructive/20 text-destructive rounded-xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 font-serif font-semibold text-lg mb-2">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <span>Something went wrong</span>
      </div>
      <div className="text-sm font-medium mb-4 text-destructive/90">
        {error.message || String(error)}
      </div>
      {error.stack && (
        <div className="mt-2 relative group">
          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-destructive/70">Stack Trace</div>
          <pre className="bg-black/85 text-red-300 p-4 rounded-lg text-xs overflow-x-auto font-mono shadow-inner border border-black">
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  );
}
