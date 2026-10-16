/**
 * Convert the subset of JSON Schema used by our tool definitions to Zod.
 *
 * The MCP SDK (v1.32) only accepts Zod schemas for registerTool, while our
 * tools are authored in JSON Schema (which is also what we document).
 * This converter bridges the two. It supports: object, string, integer,
 * number, boolean, array, enum, description, default, minimum, maximum,
 * required. Anything else becomes z.any() rather than failing.
 */
import { z } from 'zod';

export function jsonSchemaToZod(schema) {
  if (!schema || typeof schema !== 'object') return z.any();

  let out;
  if (Array.isArray(schema.enum)) {
    out = z.enum(schema.enum);
  } else {
    switch (schema.type) {
      case 'string':
        out = z.string();
        break;
      case 'integer':
        out = z.number().int();
        break;
      case 'number':
        out = z.number();
        break;
      case 'boolean':
        out = z.boolean();
        break;
      case 'array':
        out = z.array(jsonSchemaToZod(schema.items ?? {}));
        break;
      case 'object': {
        const props = schema.properties ?? {};
        // No declared properties: passthrough object (e.g. an opaque API
        // operation blob). Must NOT strip unknown keys.
        if (Object.keys(props).length === 0) {
          out = z.object({}).catchall(z.any());
          break;
        }
        const required = new Set(schema.required ?? []);
        const shape = {};
        for (const [key, sub] of Object.entries(props)) {
          let field = jsonSchemaToZod(sub);
          if (sub.description) field = field.describe(sub.description);
          if (!required.has(key) && sub.default === undefined) field = field.optional();
          shape[key] = field;
        }
        out = z.object(shape);
        break;
      }
      default:
        out = z.any();
    }
  }

  if (schema.description && out.description === undefined) out = out.describe(schema.description);
  if (schema.default !== undefined) out = out.default(schema.default);
  if ((schema.type === 'integer' || schema.type === 'number') && schema.minimum !== undefined) out = out.min(schema.minimum);
  if ((schema.type === 'integer' || schema.type === 'number') && schema.maximum !== undefined) out = out.max(schema.maximum);
  return out;
}
