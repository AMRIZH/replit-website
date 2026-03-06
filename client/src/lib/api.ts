/**
 * Utility to process standard JSON responses and correctly extract 
 * and throw detailed errors including stack traces as required.
 */
export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: Record<string, any> = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: await res.text() || res.statusText };
    }

    const error = new Error(errorData.message || 'An unexpected error occurred');
    
    // Attach backend stack traces and specific fields for the ErrorDisplay component
    if (errorData.stack) (error as any).stack = errorData.stack;
    if (errorData.field) (error as any).field = errorData.field;
    (error as any).status = res.status;
    
    throw error;
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}
