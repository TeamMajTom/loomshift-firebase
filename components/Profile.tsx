'use client';

import { updateProfile as updateAuthProfile, type User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState, type FormEvent } from 'react';

import { getFirebase } from '@/lib/firebase';

interface ProfileData {
  name: string;
  bio: string;
}

/**
 * The signed-in person's name and optional bio, stored in `profiles/{uid}`
 * and editable in place. `firestore.rules` lets them read and write only
 * their own profile.
 */
export default function Profile({ user }: { user: User }) {
  const [profile, setProfile] = useState<ProfileData>({ name: user.displayName ?? '', bio: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onSnapshot(
      doc(getFirebase().db, 'profiles', user.uid),
      (snapshot) => {
        setError(null);
        const data = snapshot.data() as Partial<ProfileData> | undefined;
        setProfile({ name: data?.name ?? user.displayName ?? '', bio: data?.bio ?? '' });
      },
      () => setError('We could not load your profile. Check your connection and try again.'),
    );
  }, [user.uid, user.displayName]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const name = profile.name.trim();
    if (!name) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setDoc(
        doc(getFirebase().db, 'profiles', user.uid),
        { name, bio: profile.bio.trim(), updatedAt: serverTimestamp() },
        { merge: true },
      );
      if (user.displayName !== name) await updateAuthProfile(user, { displayName: name });
    } catch {
      setError('We could not save your profile. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex max-w-sm flex-col gap-3">
      <h2 className="text-lg font-semibold">Profile</h2>
      <label className="flex flex-col gap-1">
        Name
        <input
          required
          value={profile.name}
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          className="rounded border px-2 py-1 text-black"
        />
      </label>
      <label className="flex flex-col gap-1">
        Bio (optional)
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
          rows={3}
          className="rounded border px-2 py-1 text-black"
        />
      </label>
      <div>
        <button type="submit" disabled={busy} className="rounded border px-3 py-1">
          Save
        </button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
