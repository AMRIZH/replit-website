import { Layout } from "@/components/layout";
import { useUser } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-admin";
import { useRecipes, useDeleteRecipe } from "@/hooks/use-recipes";
import { useLocation, Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { Trash2, ExternalLink, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function AdminPanel() {
  const { data: user, isLoading: isAuthLoading } = useUser();
  const [_, setLocation] = useLocation();

  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { data: recipes, isLoading: recipesLoading, error: recipesError } = useRecipes();
  const deleteRecipeMutation = useDeleteRecipe();

  const [adminError, setAdminError] = useState<any>(null);

  if (!isAuthLoading && (!user || user.role !== "admin")) {
    setLocation("/");
    return null;
  }

  const handleDeleteRecipe = async (id: number) => {
    if (confirm("Are you sure you want to delete this recipe? This action cannot be undone.")) {
      try {
        setAdminError(null);
        await deleteRecipeMutation.mutateAsync(id);
      } catch (err) {
        setAdminError(err);
      }
    }
  };

  return (
    <Layout>
      <div className="mb-10 flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage system users and content.</p>
        </div>
      </div>

      <ErrorDisplay error={adminError || usersError || recipesError} className="mb-8" />

      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-muted/50 p-1.5 rounded-2xl">
          <TabsTrigger value="recipes" className="rounded-xl text-base py-2 font-medium">Recipes</TabsTrigger>
          <TabsTrigger value="users" className="rounded-xl text-base py-2 font-medium">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading recipes...</TableCell>
                  </TableRow>
                ) : recipes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No recipes found.</TableCell>
                  </TableRow>
                ) : (
                  recipes?.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">{r.id}</TableCell>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.author.username}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/recipes/${r.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="View">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" 
                            onClick={() => handleDeleteRecipe(r.id)}
                            disabled={deleteRecipeMutation.isPending}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                  </TableRow>
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {u.username}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
