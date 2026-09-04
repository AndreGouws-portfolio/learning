import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-neutral-900 text-white",
        secondary: "border-transparent bg-neutral-100 text-neutral-700",
        outline: "border-neutral-300 text-neutral-700",
        blue: "border-transparent bg-blue-100 text-blue-700",
        amber: "border-transparent bg-amber-100 text-amber-800",
        purple: "border-transparent bg-purple-100 text-purple-700",
        indigo: "border-transparent bg-indigo-100 text-indigo-700",
        green: "border-transparent bg-emerald-100 text-emerald-700",
        red: "border-transparent bg-red-100 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
