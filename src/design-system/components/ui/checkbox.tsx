import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const checkboxVariants = cva(
  "peer flex h-[18px] w-[18px] flex-col items-center justify-center rounded-[4px] border border-[#E7EBF2] bg-white flex-shrink-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#2A72E5] data-[state=checked]:border-[#2A72E5] data-[state=checked]:text-white data-[state=indeterminate]:bg-[#2A72E5] data-[state=indeterminate]:border-[#2A72E5] data-[state=indeterminate]:text-white",
  {
    variants: {
      variant: {
        default: "border-[#E7EBF2]",
        error:
          "border-error-500 focus-visible:ring-error-500 data-[state=checked]:bg-error-500 data-[state=indeterminate]:bg-error-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  indeterminate?: boolean;
  className?: string;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, indeterminate = false, ...props }, ref) => {
  const [isIndeterminate, setIsIndeterminate] = React.useState(indeterminate);

  React.useEffect(() => {
    setIsIndeterminate(indeterminate);
  }, [indeterminate]);

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkboxVariants({ variant, className }))}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {isIndeterminate ? (
          <Minus className="h-3 w-3" />
        ) : (
          <Check className="h-3 w-3" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, checkboxVariants };
