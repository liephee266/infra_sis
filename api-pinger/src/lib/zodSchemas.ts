import { z } from "zod";

// Parameter schema
export const paramSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
  inPath: z.boolean().optional()
});

// Route schema
export const routeSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  description: z.string(),
  params: z.array(paramSchema),
  responseExample: z.record(z.any()).optional()
});

// Category schema
export const categorySchema = z.object({
  name: z.string(),
  description: z.string(),
  routes: z.array(routeSchema)
});

// API config schema
export const apiConfigSchema = z.object({
  title: z.string(),
  description: z.string(),
  categories: z.array(categorySchema)
});

// Export types
export type Param = z.infer<typeof paramSchema>;
export type Route = z.infer<typeof routeSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ApiConfig = z.infer<typeof apiConfigSchema>;

// Validate API config
export function validateApiConfig(config: unknown): ApiConfig {
  return apiConfigSchema.parse(config);
}

// Helper function to validate config at build time
export function validateApiConfigString(configStr: string): ApiConfig {
  try {
    const config = JSON.parse(configStr);
    return validateApiConfig(config);
  } catch (err) {
    console.error("Error validating API config:", err);
    throw err;
  }
}

// Environment schema
export const envSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string().url()
});

export type Environment = z.infer<typeof envSchema>;

// Request history item schema
export const historyItemSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  route: routeSchema,
  params: z.record(z.any()),
  environment: z.string(),
  status: z.number().optional(),
  response: z.any().optional(),
  error: z.string().optional()
});

export type HistoryItem = z.infer<typeof historyItemSchema>;
