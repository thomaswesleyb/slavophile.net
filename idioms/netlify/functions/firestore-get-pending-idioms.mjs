import db from '../../firestore.js';
import { verifyToken } from './_auth.mjs';

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

  const userDoc = await db.collection('users').doc(payload.sub).get();
  if (!userDoc.exists || !userDoc.data().admin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const snapshot = await db.collection('idioms')
      .where('approvalStatus', '==', 'pending')
      .get();

    const idioms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return new Response(JSON.stringify(idioms), {
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
