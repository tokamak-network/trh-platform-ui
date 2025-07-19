import * as React from "react";
import * as z from "zod";
import { Input, Checkbox } from "@/design-system";
import { Button } from "@/design-system";
import { Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import { PasswordInput } from "@/components/molecules";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const authFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  rememberMe: z.boolean(),
});

type AuthFormData = z.infer<typeof authFormSchema>;

export interface AuthFormProps {
  title?: string;
  subtitle?: string;
  onSubmit?: (data: AuthFormData) => void;
  isLoading?: boolean;
  className?: string;
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
    const form = useForm<AuthFormData>({
      resolver: zodResolver(authFormSchema),
      defaultValues: {
        email: "",
        password: "",
        rememberMe: false,
      },
    });

    const handleSubmit = form.handleSubmit((data) => {
      onSubmit?.(data);
    });

    return (
      <Card
        className={cn(
          "w-full max-w-md mx-auto shadow-[0_0_20px_rgba(0,0,0,0.1)] border-0",
          className
        )}
      >
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {title}
          </CardTitle>
          <p className="text-sm text-neutral-600 text-center">{subtitle}</p>
        </CardHeader>
        <CardContent>
          <form ref={ref} onSubmit={handleSubmit} className="space-y-4">
            {/* Email/Username Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-bold text-neutral-700"
              >
                Username or Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email or username"
                {...form.register("email")}
                disabled={isLoading}
                error={form.formState.errors.email?.message}
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-neutral-700"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                {...form.register("password")}
                disabled={isLoading}
                error={form.formState.errors.password?.message}
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  {...form.register("rememberMe")}
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
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || form.formState.isSubmitting}
            >
              {isLoading || form.formState.isSubmitting
                ? "Signing in..."
                : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);

AuthForm.displayName = "AuthForm";

export { AuthForm };
