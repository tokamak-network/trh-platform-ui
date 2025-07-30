import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";

export function AccountAndAwsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Account & AWS Configuration</h2>
          <p className="text-sm text-gray-500">
            Configure your account details and AWS credentials for deployment.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              type="text"
              placeholder="Enter account name"
              {...register("accountAndAws.accountName")}
            />
            {errors.accountAndAws?.accountName && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.accountName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="awsAccessKey">AWS Access Key</Label>
            <Input
              id="awsAccessKey"
              type="text"
              placeholder="Enter AWS access key"
              {...register("accountAndAws.awsAccessKey")}
            />
            {errors.accountAndAws?.awsAccessKey && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.awsAccessKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="awsSecretKey">AWS Secret Key</Label>
            <Input
              id="awsSecretKey"
              type="password"
              placeholder="Enter AWS secret key"
              {...register("accountAndAws.awsSecretKey")}
            />
            {errors.accountAndAws?.awsSecretKey && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.awsSecretKey.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="awsRegion">AWS Region</Label>
            <Select {...register("accountAndAws.awsRegion")}>
              <option value="">Select a region</option>
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-east-2">US East (Ohio)</option>
              <option value="us-west-1">US West (N. California)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              <option value="eu-central-1">EU (Frankfurt)</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
            </Select>
            {errors.accountAndAws?.awsRegion && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.awsRegion.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
