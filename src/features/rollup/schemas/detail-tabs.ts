export type RollupDetailTab =
  | "overview"
  | "components"
  | "deployments"
  | "monitoring"
  | "settings"
  | "logs"
  | "metadata"
  | "contracts"
  | "interact"
  | "drb-monitoring";

import { ThanosStack } from "./thanos";

export interface RollupDetailTabProps {
  stack?: ThanosStack;
}
