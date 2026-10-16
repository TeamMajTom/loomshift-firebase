'use client';

import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { getFirebase } from '@/lib/firebase';

/**
 * Upvotes for one question or answer, stored as `{parentPath}/votes/{voterUid}`
 * so a person can vote once. `firestore.rules` blocks voting on your own content.
 */
export default function Votes({
  parentPath,
  ownerUid,
  uid,
}: {
  parentPath: string[];
  ownerUid: string;
  uid: string;
}) {
  const [voters, setVoters] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pathKey = parentPath.join('/');

  useEffect(() => {
    const [first, ...rest] = pathKey.split('/');
    return onSnapshot(
      collection(getFirebase().db, first, ...rest, 'votes'),
      (snapshot) => setVoters(snapshot.docs.map((d) => d.id)),
      () => setError('We could not load the votes.'),
    );
  }, [pathKey]);

  const voted = voters.includes(uid);
  const own = ownerUid === uid;

  async function toggle() {
    const [first, ...rest] = pathKey.split('/');
    const ref = doc(getFirebase().db, first, ...rest, 'votes', uid);
    try {
      setError(null);
      if (voted) await deleteDoc(ref);
      else await setDoc(ref, { uid, createdAt: serverTimestamp() });
    } catch {
      setError('We could not update your vote. Please try again.');
    }
  }

  return (
    <span className="flex items-center gap-2 text-sm">
      {own ? null : (
        <button
          className="underline"
          aria-pressed={voted}
          onClick={() => void toggle()}
        >
          {voted ? 'Remove upvote' : 'Upvote'}
        </button>
      )}
      <span aria-label="Votes">
        {voters.length} {voters.length === 1 ? 'vote' : 'votes'}
      </span>
      {error ? <span role="alert">{error}</span> : null}
    </span>
  );
}
