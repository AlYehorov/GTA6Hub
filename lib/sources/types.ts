import type { SourceItemInput, SourcePlatform } from "@/lib/types/source";

export interface SourceConnector {
  readonly platform: SourcePlatform;
  fetchItems(): Promise<SourceItemInput[]>;
}
