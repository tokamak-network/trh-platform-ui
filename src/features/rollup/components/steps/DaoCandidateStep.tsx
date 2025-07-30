import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";

export function DaoCandidateStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">DAO Candidate Registration</h2>
          <p className="text-sm text-gray-500">
            Register your rollup as a DAO candidate by providing the required
            information.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="daoName">DAO Name</Label>
            <Input
              id="daoName"
              type="text"
              placeholder="Enter DAO name"
              {...register("daoCandidate.daoName")}
            />
            {errors.daoCandidate?.daoName && (
              <p className="text-sm text-red-500">
                {errors.daoCandidate.daoName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="daoDescription">Description</Label>
            <Input
              id="daoDescription"
              type="text"
              placeholder="Enter DAO description"
              {...register("daoCandidate.daoDescription")}
            />
            {errors.daoCandidate?.daoDescription && (
              <p className="text-sm text-red-500">
                {errors.daoCandidate.daoDescription.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="daoWebsite">Website</Label>
            <Input
              id="daoWebsite"
              type="url"
              placeholder="Enter DAO website URL"
              {...register("daoCandidate.daoWebsite")}
            />
            {errors.daoCandidate?.daoWebsite && (
              <p className="text-sm text-red-500">
                {errors.daoCandidate.daoWebsite.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
