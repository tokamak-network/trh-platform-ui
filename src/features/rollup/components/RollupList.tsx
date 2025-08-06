import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Activity, RefreshCw, Trash2 } from "lucide-react";
import { ThanosStack } from "../schemas/thanos";
import { useThanosStack } from "../hooks/useThanosStack";
import { RollupItem } from "./RollupItem";

interface RollupListProps {
  onCreateRollup: () => void;
  filteredRollups?: ThanosStack[];
}

export function RollupList({
  onCreateRollup,
  filteredRollups,
}: RollupListProps) {
  const router = useRouter();
  const { stacks: fetchedStacks, isLoading, isError } = useThanosStack();

  // Use filteredRollups if provided, otherwise use fetched stacks
  const stacks = filteredRollups || fetchedStacks;

  const handleViewRollup = (id: string) => {
    router.push(`/rollup/${id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading rollups...</h3>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trash2 className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading rollups</h3>
          <p className="text-muted-foreground mb-6">
            There was a problem fetching your rollups. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stacks || stacks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rollups found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filters to see more results or get started by
            creating your first rollup.
          </p>
          <Button onClick={onCreateRollup} variant="default">
            <Plus className="w-4 h-4 mr-2" />
            Create Rollup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {stacks.map((stack) => (
        <RollupItem key={stack.id} stack={stack} onClick={handleViewRollup} />
      ))}
    </div>
  );
}
