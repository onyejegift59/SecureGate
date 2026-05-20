import { cn } from "@/lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export function Label({ className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "mb-1 block text-sm font-medium text-neutral-700",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
