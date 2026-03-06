import { useQuery } from "@tanstack/react-query";
import { api, UserResponse } from "@shared/routes";
import { handleResponse } from "@/lib/api";

export function useUsers() {
  return useQuery({
    queryKey: [api.admin.users.path],
    queryFn: async () => {
      const res = await fetch(api.admin.users.path);
      return handleResponse<UserResponse[]>(res);
    },
  });
}
