import { Link } from "wouter";
import { RecipeResponse } from "@shared/routes";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image as ImageIcon, Clock } from "lucide-react";
import DOMPurify from "dompurify";
import { format } from "date-fns";

export function RecipeCard({ recipe }: { recipe: RecipeResponse }) {
  // Strip HTML tags for the preview snippet
  const previewText = DOMPurify.sanitize(recipe.description, { ALLOWED_TAGS: [] });
  
  const formattedDate = recipe.createdAt 
    ? format(new Date(recipe.createdAt), "MMM d, yyyy") 
    : "Unknown date";

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full cursor-pointer overflow-hidden border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-card flex flex-col rounded-2xl">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted/30 relative border-b border-border/50">
          {recipe.imageUrl ? (
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 bg-secondary/50">
              <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
              <span className="text-xs font-medium uppercase tracking-widest">No Image</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-6 flex-1 flex flex-col">
          <h3 className="font-serif text-2xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {recipe.title}
          </h3>
          <p className="text-muted-foreground text-sm flex-1 line-clamp-3 leading-relaxed">
            {previewText}
          </p>
        </CardContent>
        
        <CardFooter className="px-6 py-4 bg-muted/20 flex justify-between items-center text-xs font-medium text-muted-foreground border-t border-border/30">
          <span className="flex items-center gap-1.5 text-foreground/70">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
              {recipe.author.username.charAt(0).toUpperCase()}
            </span>
            {recipe.author.username}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
