import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/design-system";
import { cn } from "@/lib/utils";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  showToggle?: boolean;
  toggleButtonClassName?: string;
  containerClassName?: string;
  error?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      showToggle = true,
      toggleButtonClassName,
      containerClassName,
      error,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={cn("w-full", containerClassName)}>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className={cn(
              "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:border-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-disabled",
              showToggle && "pr-10", // Add padding for the toggle button
              error
                ? "border-error-500 focus-visible:border-error-500"
                : "border-neutral-200 focus-visible:border-primary-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {showToggle && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8",
                "text-neutral-500 hover:text-neutral-700",
                toggleButtonClassName
              )}
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
