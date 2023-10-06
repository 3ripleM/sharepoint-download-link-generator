export interface Tagged<a> {
  readonly _tag: a;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Untagged<a> = Omit<a, "_tag">;
