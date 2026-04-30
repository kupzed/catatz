// General shared types

export type ActionResult<T = null> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type DateRangeFilter = {
  from?: string;
  to?: string;
};

export type SortOrder = 'asc' | 'desc';
