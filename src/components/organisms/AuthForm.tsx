import * as React from "react";
import { Input, Checkbox } from "@/design-system";
import { Button } from "@/design-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import { PasswordInput } from "@/components/molecules";
import { cn } from "@/lib/utils";

export interface AuthFormProps {
  title?: string;
  subtitle?: string;
  onSubmit?: (data: AuthFormData) => void;
  isLoading?: boolean;
  className?: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const AuthForm = React.forwardRef<HTMLFormElement, AuthFormProps>(
  (
    {
      title = "Sign In",
      subtitle = "Enter your credentials to access the platform",
      onSubmit,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const [formData, setFormData] = React.useState<AuthFormData>({
      email: "",
      password: "",
      rememberMe: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.(formData);
    };

    const handleInputChange = (
      field: keyof AuthFormData,
      value: string | boolean
    ) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    return (
      <Card className={cn("w-full max-w-md mx-auto", className)}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {title}
          </CardTitle>
          <p className="text-sm text-neutral-600 text-center">{subtitle}</p>
        </CardHeader>
        <CardContent>
          <form ref={ref} onSubmit={handleSubmit} className="space-y-4">
            {/* Email/Username Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-neutral-700"
              >
                Username or Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email or username"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    handleInputChange("rememberMe", checked as boolean)
                  }
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm text-neutral-700"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-primary-500 hover:text-primary-600 hover:underline"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);

AuthForm.displayName = "AuthForm";

export { AuthForm };
