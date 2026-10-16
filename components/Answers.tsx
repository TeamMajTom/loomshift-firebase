'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { useEffect, useState, type FormEvent } from 'react';

import { getFirebase } from '@/lib/firebase';

import Votes from './Votes';

interface Answer {
  id: string;
  uid: string;
  authorName: string;
  body: string;
  createdAt: number;
}

/**
 * Answers to one question, stored in `questions/{questionId}/answers`.
 * `firestore.rules` lets only the author edit or delete their own answer.
 */
export default function Answers({
  questionId,
  uid,
  authorName,
}: {
  questionId: string;
  uid: string;
  authorName: string;
}) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    return onSnapshot(
      collection(getFirebase().db, 'questions', questionId, 'answers'),
      (snapshot) => {
        setError(null);
        setAnswers(
          snapshot.docs
            .map((d) => {
              const data = d.data() as {
                uid?: string;
                authorName?: string;
                body?: string;
                createdAt?: Timestamp | null;
              };
              return {
                id: d.id,
                uid: data.uid ?? '',
                authorName: data.authorName ?? 'Author',
                body: data.body ?? '',
                createdAt: data.createdAt?.toMillis() ?? Date.now(),
              };
            })
            .sort((a, b) => a.createdAt - b.createdAt),
        );
      },
      () => setError('We could not load the answers. Check your connection and try again.'),
    );
  }, [questionId]);

  async function answer(event: FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody('');
    try {
      await addDoc(collection(getFirebase().db, 'questions', questionId, 'answers'), {
        uid,
        authorName,
        body: text,
        createdAt: serverTimestamp(),
      });
    } catch {
      setError('We could not post your answer. Please try again.');
    }
  }

  async function saveEdit(event: FormEvent, id: string) {
    event.preventDefault();
    const text = editBody.trim();
    if (!text) return;
    try {
      await updateDoc(doc(getFirebase().db, 'questions', questionId, 'answers', id), {
        body: text,
      });
      setEditingId(null);
    } catch {
      setError('We could not save your changes. Please try again.');
    }
  }

  async function remove(id: string) {
    try {
      await deleteDoc(doc(getFirebase().db, 'questions', questionId, 'answers', id));
    } catch {
      setError('We could not delete your answer. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-2 pl-4">
      <ul className="flex flex-col gap-2">
        {answers.map((a) =>
          editingId === a.id ? (
            <li key={a.id}>
              <form onSubmit={(e) => void saveEdit(e, a.id)} className="flex flex-col gap-2">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  className="rounded border px-2 py-1 text-black"
                />
                <div className="flex gap-2">
                  <button type="submit" className="rounded border px-3 py-1">
                    Save
                  </button>
                  <button type="button" className="underline" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            </li>
          ) : (
            <li key={a.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-semibold">{a.authorName}</span>
                {a.uid === uid ? (
                  <span className="flex gap-2">
                    <button
                      className="underline"
                      onClick={() => {
                        setEditingId(a.id);
                        setEditBody(a.body);
                      }}
                    >
                      Edit
                    </button>
                    <button className="underline" onClick={() => void remove(a.id)}>
                      Delete
                    </button>
                  </span>
                ) : null}
              </div>
              <p>{a.body}</p>
              <Votes
                parentPath={['questions', questionId, 'answers', a.id]}
                ownerUid={a.uid}
                uid={uid}
              />
            </li>
          ),
        )}
      </ul>
      <form onSubmit={answer} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write an answer"
          rows={2}
          className="rounded border px-2 py-1 text-black"
        />
        <button type="submit" className="self-start rounded border px-3 py-1">
          Answer
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
