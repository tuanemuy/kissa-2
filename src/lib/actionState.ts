import type { AnyError } from "./error";

export interface ActionState<TResult, TError = AnyError> {
  result?: TResult;
  error: TError | null;
}
