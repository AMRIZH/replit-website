import { db } from "./db";
import {
  users, recipes,
  type User, type InsertUser, type Recipe, type InsertRecipe
} from "@shared/schema";
import { eq, ilike } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  getRecipes(search?: string): Promise<(Recipe & { author: { id: number, username: string } })[]>;
  getRecipe(id: number): Promise<(Recipe & { author: { id: number, username: string } }) | undefined>;
  createRecipe(recipe: InsertRecipe & { authorId: number }): Promise<Recipe & { author: { id: number, username: string } }>;
  updateRecipe(id: number, updates: Partial<InsertRecipe>): Promise<Recipe & { author: { id: number, username: string } }>;
  deleteRecipe(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [existing] = await db.select().from(users).limit(1);
    const role = existing ? "user" : "admin";
    const [user] = await db.insert(users).values({ ...insertUser, role }).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getRecipes(search?: string) {
    let query = db.select({
      recipe: recipes,
      author: {
        id: users.id,
        username: users.username,
      },
    }).from(recipes).innerJoin(users, eq(recipes.authorId, users.id));

    if (search) {
      query = query.where(ilike(recipes.title, `%${search}%`)) as any;
    }

    const results = await query;
    return results.map(r => ({ ...r.recipe, author: r.author }));
  }

  async getRecipe(id: number) {
    const [result] = await db.select({
      recipe: recipes,
      author: {
        id: users.id,
        username: users.username,
      }
    }).from(recipes).innerJoin(users, eq(recipes.authorId, users.id)).where(eq(recipes.id, id));

    if (!result) return undefined;
    return { ...result.recipe, author: result.author };
  }

  async createRecipe(recipe: InsertRecipe & { authorId: number }) {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return this.getRecipe(created.id) as Promise<Recipe & { author: { id: number, username: string } }>;
  }

  async updateRecipe(id: number, updates: Partial<InsertRecipe>) {
    await db.update(recipes).set(updates).where(eq(recipes.id, id));
    return this.getRecipe(id) as Promise<Recipe & { author: { id: number, username: string } }>;
  }

  async deleteRecipe(id: number) {
    await db.delete(recipes).where(eq(recipes.id, id));
  }
}

export const storage = new DatabaseStorage();
