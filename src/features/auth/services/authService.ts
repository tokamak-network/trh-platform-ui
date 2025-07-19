import { apiPost, ApiError } from "@/lib/api";
import { LoginRequest, LoginResponse, loginResponseSchema } from "../schemas";

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiPost<LoginResponse>("auth/login", credentials);
      // Validate response with Zod schema
      const validatedResponse = loginResponseSchema.parse(response);
      return validatedResponse;
    } catch (error) {
      const apiError = error as ApiError;

      if (apiError.status === 401) {
        throw new Error("Invalid email or password");
      }
      if (apiError.status === 400) {
        throw new Error("Invalid request data");
      }
      if (apiError.status >= 500) {
        throw new Error("Server error. Please try again later.");
      }
      throw new Error(apiError.message || "Login failed");
    }
  }

  // Helper method to get stored token
  getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  }

  // Helper method to store token
  storeToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token);
    }
  }

  // Helper method to remove token
  removeToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
  }
}

export const authService = AuthService.getInstance();
