import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
