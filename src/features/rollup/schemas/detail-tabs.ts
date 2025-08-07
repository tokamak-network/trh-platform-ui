export type RollupDetailTab =
  | "overview"
  | "components"
  | "monitoring"
  | "settings"
  | "logs";

import { ThanosStack } from "./thanos";

export interface RollupDetailTabProps {
  stack?: ThanosStack;
}
