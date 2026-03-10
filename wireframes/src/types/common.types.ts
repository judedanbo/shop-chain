import type { ReactNode, CSSProperties } from 'react';

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ValueOf<T> = T[keyof T];

export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export type ClickHandler<T = HTMLButtonElement> = React.MouseEventHandler<T>;
export type ChangeHandler<T = HTMLInputElement> = React.ChangeEventHandler<T>;
export type SubmitHandler = React.FormEventHandler<HTMLFormElement>;

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: Nullable<T>;
  status: LoadingState;
  error: Nullable<string>;
}
