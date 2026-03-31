export interface DataFetcher {
  readonly sourceKey: string;
  fetch(): Promise<void>;
}
