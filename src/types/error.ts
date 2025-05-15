export interface ErrorResponse {
  status: string;
  message: string;
  stack?: string;
  errors?: any[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

export interface APIError {
  statusCode: number;
  message: string;
  errors?: any[];
}
