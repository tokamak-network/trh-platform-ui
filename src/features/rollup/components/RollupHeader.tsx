import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export function RollupHeader() {
  const router = useRouter();

  const handleCreateRollup = () => {
    router.push("/rollup/create");
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Rollups Management
        </h1>
        <p className="text-muted-foreground">
          Manage and monitor your Layer 2 rollups
        </p>
      </div>
      <Button
        onClick={handleCreateRollup}
        variant="default"
        className="cursor-pointer"
      >
        <Zap className="w-4 h-4 mr-2" />
        Deploy New Rollup
      </Button>
    </div>
  );
}
