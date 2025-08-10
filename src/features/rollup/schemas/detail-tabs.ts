export type RollupDetailTab =
  | "overview"
  | "components"
  | "deployments"
  | "monitoring"
  | "settings"
  | "logs";

import { ThanosStack } from "./thanos";

export interface RollupDetailTabProps {
  stack?: ThanosStack;
}
