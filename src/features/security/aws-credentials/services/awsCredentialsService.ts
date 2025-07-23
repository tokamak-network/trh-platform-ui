import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/lib/api";
import {
  AWSCredential,
  CreateAWSCredentialRequest,
  UpdateAWSCredentialRequest,
  AWSCredentialsListResponse,
  AWSCredentialResponse,
  awsCredentialsListResponseSchema,
  awsCredentialResponseSchema,
} from "../../schemas";

// Mock data for development
const mockCredentials: AWSCredential[] = [
  {
    id: "aws_1",
    name: "Production AWS Account",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    region: "us-east-1",
    createdAt: "2024-01-15",
    lastUsed: "2 hours ago",
    status: "active",
  },
  {
    id: "aws_2",
    name: "Development AWS Account",
    accessKeyId: "AKIAI44QH8DHBEXAMPLE",
    secretAccessKey: "je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY",
    region: "us-west-2",
    createdAt: "2024-02-01",
    lastUsed: "1 day ago",
    status: "active",
  },
];

export class AwsCredentialsService {
  private static instance: AwsCredentialsService | null = null;
  private mockData: AWSCredential[];
  private useMockData: boolean;

  private constructor() {
    this.mockData = [...mockCredentials];
    this.useMockData = true; // Set to false when real API is available
  }

  public static getInstance(): AwsCredentialsService {
    if (!AwsCredentialsService.instance) {
      AwsCredentialsService.instance = new AwsCredentialsService();
    }
    return AwsCredentialsService.instance;
  }

  // AWS Credentials methods
  async getAwsCredentials(): Promise<AWSCredential[]> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return [...this.mockData];
    }

    try {
      const response = await apiGet<AWSCredentialsListResponse>(
        "security/aws-credentials"
      );
      const validatedResponse =
        awsCredentialsListResponseSchema.parse(response);
      return validatedResponse.credentials;
    } catch (error) {
      const apiError = error as ApiError;
      throw new Error(apiError.message || "Failed to fetch AWS credentials");
    }
  }

  async createAwsCredential(
    data: CreateAWSCredentialRequest
  ): Promise<AWSCredential> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Check for duplicate names
      if (this.mockData.some((cred) => cred.name === data.name)) {
        throw new Error("AWS credential with this name already exists");
      }

      const newCredential: AWSCredential = {
        id: `aws_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString().split("T")[0],
        status: "active",
      };

      this.mockData.push(newCredential);
      return newCredential;
    }

    try {
      const response = await apiPost<AWSCredentialResponse>(
        "security/aws-credentials",
        data
      );
      const validatedResponse = awsCredentialResponseSchema.parse(response);
      return validatedResponse.credential;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 400) {
        throw new Error("Invalid credential data");
      }
      if (apiError.status === 409) {
        throw new Error("AWS credential with this name already exists");
      }
      throw new Error(apiError.message || "Failed to create AWS credential");
    }
  }

  async updateAwsCredential(
    id: string,
    data: UpdateAWSCredentialRequest
  ): Promise<AWSCredential> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const credentialIndex = this.mockData.findIndex((cred) => cred.id === id);
      if (credentialIndex === -1) {
        throw new Error("AWS credential not found");
      }

      // Check for duplicate names (excluding current credential)
      if (
        data.name &&
        this.mockData.some((cred) => cred.name === data.name && cred.id !== id)
      ) {
        throw new Error("AWS credential with this name already exists");
      }

      const updatedCredential = {
        ...this.mockData[credentialIndex],
        ...data,
      };

      this.mockData[credentialIndex] = updatedCredential;
      return updatedCredential;
    }

    try {
      const response = await apiPut<AWSCredentialResponse>(
        `security/aws-credentials/${id}`,
        data
      );
      const validatedResponse = awsCredentialResponseSchema.parse(response);
      return validatedResponse.credential;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        throw new Error("AWS credential not found");
      }
      if (apiError.status === 400) {
        throw new Error("Invalid credential data");
      }
      throw new Error(apiError.message || "Failed to update AWS credential");
    }
  }

  async deleteAwsCredential(id: string): Promise<void> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const credentialIndex = this.mockData.findIndex((cred) => cred.id === id);
      if (credentialIndex === -1) {
        throw new Error("AWS credential not found");
      }

      this.mockData.splice(credentialIndex, 1);
      return;
    }

    try {
      await apiDelete(`security/aws-credentials/${id}`);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        throw new Error("AWS credential not found");
      }
      if (apiError.status === 409) {
        throw new Error("Cannot delete credential that is currently in use");
      }
      throw new Error(apiError.message || "Failed to delete AWS credential");
    }
  }

  async testAwsCredential(id: string): Promise<boolean> {
    if (this.useMockData) {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const credential = this.mockData.find((cred) => cred.id === id);
      if (!credential) {
        throw new Error("AWS credential not found");
      }

      // Mock validation - just check if it's not empty
      if (!credential.accessKeyId || !credential.secretAccessKey) {
        throw new Error("Invalid AWS credentials");
      }

      return true;
    }

    try {
      await apiPost(`security/aws-credentials/${id}/test`, {});
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        throw new Error("AWS credential not found");
      }
      if (apiError.status === 401) {
        throw new Error("Invalid AWS credentials");
      }
      throw new Error(apiError.message || "Failed to test AWS credential");
    }
  }

  // Utility methods
  maskSecretKey(secretKey: string): string {
    if (secretKey.length <= 8) {
      return "•".repeat(secretKey.length);
    }
    return `${secretKey.slice(0, 4)}${"•".repeat(32)}${secretKey.slice(-4)}`;
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  // Development utility to toggle mock data
  setUseMockData(useMock: boolean) {
    this.useMockData = useMock;
  }

  // Reset mock data to initial state
  resetMockData() {
    this.mockData = [...mockCredentials];
  }
}

// Create and export the singleton instance
export const awsCredentialsService = AwsCredentialsService.getInstance();
