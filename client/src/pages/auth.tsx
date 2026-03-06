import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { BookOpen } from "lucide-react";

export default function AuthPage() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [_, setLocation] = useLocation();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  
  const isPending = loginMutation.isPending || registerMutation.isPending;
  const activeError = isLoginView ? loginMutation.error : registerMutation.error;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLoginView) {
        await loginMutation.mutateAsync({ username, password });
      } else {
        await registerMutation.mutateAsync({ username, password });
      }
      setLocation("/");
    } catch (err) {
      // Error handled by query hook and displayed via ErrorDisplay
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-md shadow-lg border-border/50 rounded-2xl overflow-hidden">
          <div className="h-2 bg-primary w-full"></div>
          <CardHeader className="text-center pb-6 pt-8">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-serif">
              {isLoginView ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {isLoginView 
                ? "Enter your credentials to access your recipes" 
                : "Join the community and share your culinary secrets"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <ErrorDisplay error={activeError} />
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  required
                  placeholder="chef_master"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl h-12 px-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-12 px-4"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-md font-semibold mt-6"
                disabled={isPending}
              >
                {isPending ? "Processing..." : (isLoginView ? "Sign In" : "Sign Up")}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  loginMutation.reset();
                  registerMutation.reset();
                }}
                className="text-primary font-semibold hover:underline"
              >
                {isLoginView ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
