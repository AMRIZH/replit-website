import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, UserResponse } from "@shared/routes";
import { handleResponse } from "@/lib/api";
import { z } from "zod";

type AuthInput = z.infer<typeof api.auth.login.input>;

export function useUser() {
  return useQuery({
    queryKey: [api.auth.user.path],
    queryFn: async () => {
      const res = await fetch(api.auth.user.path);
      if (res.status === 401) return null;
      return handleResponse<UserResponse>(res);
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AuthInput) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<UserResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AuthInput) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<UserResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.auth.logout.path, { method: api.auth.logout.method });
      return handleResponse<{ message: string }>(res);
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.user.path], null);
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
    },
  });
}
