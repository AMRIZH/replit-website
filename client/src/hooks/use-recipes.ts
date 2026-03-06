import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, RecipeResponse } from "@shared/routes";
import { handleResponse } from "@/lib/api";
import { z } from "zod";

type CreateRecipeInput = z.infer<typeof api.recipes.create.input>;
type UpdateRecipeInput = z.infer<typeof api.recipes.update.input>;

export function useRecipes(search?: string) {
  return useQuery({
    queryKey: [api.recipes.list.path, search],
    queryFn: async () => {
      const url = new URL(api.recipes.list.path, window.location.origin);
      if (search) url.searchParams.append("search", search);
      
      const res = await fetch(url.toString());
      return handleResponse<RecipeResponse[]>(res);
    },
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: [api.recipes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.recipes.get.path, { id });
      const res = await fetch(url);
      return handleResponse<RecipeResponse>(res);
    },
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecipeInput) => {
      const res = await fetch(api.recipes.create.path, {
        method: api.recipes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<RecipeResponse>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRecipeInput }) => {
      const url = buildUrl(api.recipes.update.path, { id });
      const res = await fetch(url, {
        method: api.recipes.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<RecipeResponse>(res);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.recipes.get.path, variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.recipes.delete.path, { id });
      const res = await fetch(url, {
        method: api.recipes.delete.method,
      });
      return handleResponse<{ message: string }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(api.upload.image.path, {
        method: api.upload.image.method,
        body: formData,
      });
      return handleResponse<{ url: string }>(res);
    },
  });
}
