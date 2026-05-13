import db from '../../firestore.js';
import { verifyToken } from './_auth.mjs';
import { z } from 'zod';

const SaveSchema = z.object({
  idiom_id: z.string().min(1).max(200),
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
    const parseResult = SaveSchema.safeParse(data);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { idiom_id } = parseResult.data;
    const authenticatedUserId = payload.sub;
    const userDocRef = db.collection('users').doc(authenticatedUserId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return new Response(JSON.stringify({ message: 'User does not exist' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userData = userDoc.data();
    if (userData.idioms && userData.idioms.includes(idiom_id)) {
      return new Response(JSON.stringify({ message: 'Idiom already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentIdioms = userData.idioms || [];
    currentIdioms.push(idiom_id);
    await userDocRef.update({ idioms: currentIdioms });

    return new Response(JSON.stringify({ message: 'Idiom added successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
