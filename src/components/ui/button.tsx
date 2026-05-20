import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-900",
        variant === "secondary" && "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500",
        variant === "ghost" && "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:ring-neutral-500",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
        variant === "outline" && "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50 focus:ring-neutral-500",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
