export type RollupDetailTab =
  | "overview"
  | "components"
  | "monitoring"
  | "settings"
  | "logs";

export interface RollupDetailTabProps {
  stack?: unknown; // Replace with proper type when available
}
