export interface FormState<T = unknown, E = unknown, R = unknown> {
  input?: T;
  result?: R;
  error?: E | null;
}

// Specific type for authentication forms with validation errors
export interface AuthFormState<T = unknown> extends FormState<T, Record<string, string> | { message: string } | null> {}
