import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Parses and validates a JSON request body against a zod schema.
 *
 * On failure it returns a ready-to-send 400 response instead of throwing, so
 * route handlers stay flat:
 *
 *   const parsed = await parseBody(req, Schema)
 *   if (!parsed.ok) return parsed.response
 *   const { email } = parsed.data
 */
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }

export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
  message = 'Invalid request body'
): Promise<ParseResult<z.output<S>>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: message, details: z.flattenError(result.error).fieldErrors },
        { status: 400 }
      ),
    }
  }

  return { ok: true, data: result.data }
}

/** Validates search params (for GET/DELETE handlers) the same way. */
export function parseSearchParams<S extends z.ZodType>(
  req: Request,
  schema: S,
  message = 'Invalid query parameters'
): ParseResult<z.output<S>> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries())
  const result = schema.safeParse(params)

  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: message, details: z.flattenError(result.error).fieldErrors },
        { status: 400 }
      ),
    }
  }

  return { ok: true, data: result.data }
}

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

export const uuidSchema = z.uuid()

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .toLowerCase()
  .pipe(z.email())

export const passwordSchema = z.string().min(6).max(72)

/** Personal name: no control characters, trimmed, bounded. */
export const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[^\p{C}]+$/u, 'Invalid characters')

/** Gymnasium class: 1–4. Accepts the numeric strings that forms send. */
export const classNumberSchema = z.coerce.number().int().min(1).max(4)

/** Section inside a class: 1–6 (matches the DB check constraint). */
export const sectionNumberSchema = z.coerce.number().int().min(1).max(6)
