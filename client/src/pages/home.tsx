import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useRecipes } from "@/hooks/use-recipes";
import { RecipeCard } from "@/components/recipe-card";
import { Input } from "@/components/ui/input";
import { Search, ChefHat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: recipes, isLoading, error } = useRecipes(debouncedSearch);

  return (
    <Layout>
      <div className="mb-12 max-w-2xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-foreground">
          Discover Culinary Delights
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Explore recipes shared by our community or contribute your own masterpiece.
        </p>
        
        <div className="relative group shadow-sm rounded-2xl overflow-hidden">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Search className="h-5 w-5" />
          </div>
          <Input 
            className="w-full pl-12 py-7 text-lg bg-white border-border/60 focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-2xl"
            placeholder="Search recipes by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <ErrorDisplay error={error} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/30 rounded-3xl border border-dashed border-border">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-xl font-serif font-semibold mb-2">No recipes found</h3>
          <p className="text-muted-foreground">
            {search ? "Try adjusting your search terms." : "Be the first to share a recipe!"}
          </p>
        </div>
      )}
    </Layout>
  );
}
