export type RollupDetailTab =
  | "overview"
  | "components"
  | "deployments"
  | "monitoring"
  | "settings"
  | "logs"
  | "metadata"
  | "backup"
  | "chain-data";

import { ThanosStack } from "./thanos";

export interface RollupDetailTabProps {
  stack?: ThanosStack;
}
