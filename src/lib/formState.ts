export interface FormState<T = any, E = any> {
  input?: T;
  result?: any;
  error?: E | null;
}
