import db from '../../firestore.js';

export default async () => {
  try {
    const snapshot = await db.collection('idioms')
      .where('approvalStatus', '==', 'approved')
      .get();

    const idioms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

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
