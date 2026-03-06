import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useRecipe, useCreateRecipe, useUpdateRecipe, useUploadImage } from "@/hooks/use-recipes";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ChevronLeft, Image as ImageIcon, UploadCloud } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeForm() {
  const [match, params] = useRoute("/recipes/:id/edit");
  const isEdit = !!params?.id;
  const id = isEdit ? Number(params.id) : 0;

  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: existingRecipe, isLoading: isRecipeLoading, error: fetchError } = useRecipe(id);
  
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const uploadMutation = useUploadImage();
  const [_, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [formError, setFormError] = useState<any>(null);

  useEffect(() => {
    if (isEdit && existingRecipe) {
      setTitle(existingRecipe.title);
      setDescription(existingRecipe.description);
      setImageUrl(existingRecipe.imageUrl || "");
    }
  }, [isEdit, existingRecipe]);

  // Auth Guard
  if (!isUserLoading && !user) {
    setLocation("/auth");
    return null;
  }

  // Edit Guard
  if (isEdit && !isRecipeLoading && existingRecipe && user) {
    if (user.id !== existingRecipe.authorId && user.role !== "admin") {
      return (
        <Layout>
          <ErrorDisplay error={new Error("You do not have permission to edit this recipe.")} />
        </Layout>
      );
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setFormError(null);
      const fd = new FormData();
      fd.append("image", file);
      const res = await uploadMutation.mutateAsync(fd);
      setImageUrl(res.url);
    } catch (err) {
      setFormError(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description === "<p><br></p>") {
      setFormError(new Error("Description is required."));
      return;
    }
    
    try {
      setFormError(null);
      const payload = { title, description, imageUrl: imageUrl || null };
      
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: payload });
        setLocation(`/recipes/${id}`);
      } else {
        const res = await createMutation.mutateAsync(payload);
        setLocation(`/recipes/${res.id}`);
      }
    } catch (err) {
      setFormError(err);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const combinedError = formError || createMutation.error || updateMutation.error || fetchError;

  if (isEdit && isRecipeLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Link href={isEdit ? `/recipes/${id}` : "/"} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          {isEdit ? "Back to Recipe" : "Back to Home"}
        </Link>

        <h1 className="text-4xl font-serif font-bold mb-8 text-foreground">
          {isEdit ? "Edit Recipe" : "Create New Recipe"}
        </h1>

        <ErrorDisplay error={combinedError} className="mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8 bg-card p-8 sm:p-10 rounded-3xl border border-border/50 shadow-sm">
          
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base">Recipe Title</Label>
            <Input 
              id="title"
              required 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Rustic Sourdough Bread"
              className="text-lg py-6 px-4 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">Featured Image</Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input 
                  placeholder="Paste image URL here..." 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="pl-11 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-center font-medium text-muted-foreground text-sm uppercase tracking-wide">OR</div>
              <div className="relative">
                <Button 
                  type="button" 
                  variant="secondary" 
                  className="w-full sm:w-auto rounded-xl shadow-sm"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={uploadMutation.isPending}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload File"}
                </Button>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
            
            {imageUrl && (
              <div className="mt-6 rounded-2xl overflow-hidden border border-border/50 shadow-sm relative group">
                <img src={imageUrl} alt="Preview" className="w-full h-64 object-cover" />
                <button 
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-base">Recipe Description & Instructions</Label>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-input">
              <ReactQuill 
                theme="snow" 
                value={description} 
                onChange={setDescription} 
                placeholder="Write your ingredients and steps here..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-4">
            <Link href={isEdit ? `/recipes/${id}` : "/"}>
              <Button type="button" variant="ghost" className="rounded-xl">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              className="rounded-xl px-8 shadow-sm font-semibold text-md"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Recipe"}
            </Button>
          </div>

        </form>
      </div>
    </Layout>
  );
}
