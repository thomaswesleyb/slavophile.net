import db from '../../firestore.js';
import { verifyToken } from './_auth.mjs';
import { z } from 'zod';

const ApproveSchema = z.object({
  idiom_id: z.string().min(1).max(200),
  action: z.enum(['approve', 'reject']),
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

  // Verify admin status
  const userDoc = await db.collection('users').doc(payload.sub).get();
  if (!userDoc.exists || !userDoc.data().admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await req.json();
    const parseResult = ApproveSchema.safeParse(data);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { idiom_id, action } = parseResult.data;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await db.collection('idioms').doc(idiom_id).update({ approvalStatus: newStatus });

    return new Response(JSON.stringify({ message: `Idiom ${newStatus}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Internal server error', error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
