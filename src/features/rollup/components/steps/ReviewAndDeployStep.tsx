import { Card } from "@/components/ui/card";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";

export function ReviewAndDeployStep() {
  const { watch } = useFormContext<CreateRollupFormData>();
  const formData = watch();

  const sections = [
    {
      title: "Network & Chain",
      data: [
        { label: "Network", value: formData.networkAndChain.network },
        { label: "Chain", value: formData.networkAndChain.chainName },
      ],
    },
    {
      title: "Account & AWS",
      data: [
        { label: "Account Name", value: formData.accountAndAws.accountName },
        { label: "AWS Access Key", value: "••••••••" },
        { label: "AWS Secret Key", value: "••••••••" },
        { label: "AWS Region", value: formData.accountAndAws.awsRegion },
      ],
    },
    formData.daoCandidate && {
      title: "DAO Candidate",
      data: [
        { label: "Amount", value: `${formData.daoCandidate.amount} TON` },
        { label: "Memo", value: formData.daoCandidate.memo },
        { label: "Name Information", value: formData.daoCandidate.nameInfo },
      ],
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Review Configuration</h2>
          <p className="text-sm text-gray-500">
            Review your rollup configuration before deployment.
          </p>
        </div>

        <div className="space-y-6">
          {sections.filter(Boolean).map((section) => {
            if (!section) return null;
            return (
              <div key={section.title} className="space-y-4">
                <h3 className="font-medium text-gray-900">{section.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {section.data.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-900">
                        {item.value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Deployment Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Please ensure all information is correct before proceeding
                  with deployment. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
