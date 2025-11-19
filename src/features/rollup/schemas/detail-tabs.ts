export type RollupDetailTab =
  | "overview"
  | "components"
  | "deployments"
  | "monitoring"
  | "settings"
  | "logs"
  | "metadata"
  | "contracts";

import { ThanosStack } from "./thanos";

export interface RollupDetailTabProps {
  stack?: ThanosStack;
}
