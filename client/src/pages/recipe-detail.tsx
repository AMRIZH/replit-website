import { useRoute, useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useRecipe, useDeleteRecipe } from "@/hooks/use-recipes";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { Edit, Trash2, ChevronLeft, Calendar, User as UserIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function RecipeDetail() {
  const [match, params] = useRoute("/recipes/:id");
  const [_, setLocation] = useLocation();
  const id = Number(params?.id);

  const { data: recipe, isLoading, error: queryError } = useRecipe(id);
  const { data: user } = useUser();
  const deleteMutation = useDeleteRecipe();
  
  const [deleteError, setDeleteError] = useState<any>(null);

  const canEditOrDelete = user && recipe && (user.id === recipe.authorId || user.role === "admin");

  const handleDelete = async () => {
    try {
      setDeleteError(null);
      await deleteMutation.mutateAsync(id);
      setLocation("/");
    } catch (err) {
      setDeleteError(err);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <Skeleton className="h-14 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (queryError || !recipe) {
    return (
      <Layout>
        <ErrorDisplay error={queryError || new Error("Recipe not found")} />
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </Layout>
    );
  }

  const formattedDate = recipe.createdAt ? format(new Date(recipe.createdAt), "MMMM d, yyyy") : "";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Recipes
        </Link>

        <ErrorDisplay error={deleteError} />

        <div className="bg-card rounded-3xl shadow-sm border border-border/60 overflow-hidden mb-12">
          {recipe.imageUrl && (
            <div className="w-full h-[400px] sm:h-[500px] relative">
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <h1 className="absolute bottom-8 left-8 right-8 text-4xl sm:text-5xl font-serif font-bold text-white leading-tight">
                {recipe.title}
              </h1>
            </div>
          )}

          <div className="p-8 sm:p-12">
            {!recipe.imageUrl && (
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight mb-8">
                {recipe.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-border mb-8 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-full">
                <UserIcon className="w-4 h-4 text-primary" />
                <span className="text-foreground">By {recipe.author.username}</span>
              </div>
              {formattedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </div>
              )}

              {canEditOrDelete && (
                <div className="ml-auto flex gap-3">
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    <Button variant="outline" size="sm" className="rounded-xl shadow-sm">
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="rounded-xl shadow-sm">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif text-2xl">Delete Recipe?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                          This action cannot be undone. This will permanently delete your recipe.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl" disabled={deleteMutation.isPending}>
                          {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            <div 
              className="prose-recipe text-lg"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(recipe.description) }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
