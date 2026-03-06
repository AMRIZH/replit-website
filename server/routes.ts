import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import passport from "passport";

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize multer for file uploads
const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // Helper middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
  };

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after register", stack: err.stack });
        res.status(201).json({ id: user.id, username: user.username, role: user.role, createdAt: user.createdAt });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: err.message, stack: err.stack });
      if (!user) return res.status(401).json({ message: info?.message || "Unauthorized" });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: err.message, stack: err.stack });
        res.status(200).json({ id: user.id, username: user.username, role: user.role, createdAt: user.createdAt });
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.auth.user.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json({ id: req.user.id, username: req.user.username, role: req.user.role, createdAt: req.user.createdAt });
  });

  app.get(api.recipes.list.path, async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const recipes = await storage.getRecipes(search);
      res.status(200).json(recipes);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  app.get(api.recipes.get.path, async (req, res) => {
    try {
      const recipe = await storage.getRecipe(Number(req.params.id));
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      res.status(200).json(recipe);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  app.post(api.recipes.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.recipes.create.input.parse(req.body);
      const recipe = await storage.createRecipe({ ...input, authorId: req.user.id });
      res.status(201).json(recipe);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  app.put(api.recipes.update.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      
      if (recipe.authorId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const input = api.recipes.update.input.parse(req.body);
      const updated = await storage.updateRecipe(id, input);
      res.status(200).json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  app.delete(api.recipes.delete.path, requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const recipe = await storage.getRecipe(id);
      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
      
      if (recipe.authorId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      await storage.deleteRecipe(id);
      res.status(200).json({ message: "Deleted" });
    } catch (err) {
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  app.get(api.admin.users.path, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.status(200).json(users.map(u => ({ id: u.id, username: u.username, role: u.role, createdAt: u.createdAt })));
    } catch (err) {
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  // Basic file upload
  app.post(api.upload.image.path, requireAuth, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filename = req.file.filename;
      res.status(200).json({ url: `/uploads/${filename}` });
    } catch (err) {
      res.status(500).json({ message: (err as Error).message, stack: (err as Error).stack });
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  return httpServer;
}
