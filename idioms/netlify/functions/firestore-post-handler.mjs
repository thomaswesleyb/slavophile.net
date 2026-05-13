import db from '../../firestore.js';
import { verifyToken } from './_auth.mjs';
import { z } from 'zod';

const IdiomRowSchema = z.object({
  idiom: z.string().min(1).max(500),
  translation: z.string().min(1).max(500),
  definition: z.string().min(1).max(1000),
  example: z.string().max(1000).optional(),
});

const SubmitSchema = z.object({
  rows: z.array(IdiomRowSchema).min(1).max(20),
});

export default async (req) => {
  let payload;
  try {
    payload = await verifyToken(req);
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await req.json();
    const parseResult = SubmitSchema.safeParse(data);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parseResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { rows } = parseResult.data;
    const transformedData = rows.map(row => ({
      idiom: row.idiom,
      english: row.translation,
      definition: row.definition,
      example: row.example || '',
      submittedBy: payload.sub,
      approvalStatus: 'pending',
      createdAt: new Date(),
    }));

    for (const idiom of transformedData) {
      await db.collection('idioms').add(idiom);
    }

    return new Response(JSON.stringify({ message: 'Document added to Firestore' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to add document to Firestore' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
