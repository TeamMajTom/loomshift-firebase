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

interface Question {
  id: string;
  uid: string;
  title: string;
  body: string;
  createdAt: number;
}

/**
 * Every signed-in author's questions, visible to anyone signed in.
 * `firestore.rules` lets only the author edit or delete their own question.
 */
export default function Questions({ uid }: { uid: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    // Sorted here, not with orderBy(): a just-posted question has no server
    // timestamp yet, so this keeps it at the top without waiting on a round trip.
    return onSnapshot(
      collection(getFirebase().db, 'questions'),
      (snapshot) => {
        setError(null);
        setQuestions(
          snapshot.docs
            .map((d) => {
              const data = d.data() as {
                uid?: string;
                title?: string;
                body?: string;
                createdAt?: Timestamp | null;
              };
              return {
                id: d.id,
                uid: data.uid ?? '',
                title: data.title ?? '',
                body: data.body ?? '',
                createdAt: data.createdAt?.toMillis() ?? Date.now(),
              };
            })
            .sort((a, b) => b.createdAt - a.createdAt),
        );
      },
      () => setError('We could not load the questions. Check your connection and try again.'),
    );
  }, []);

  async function ask(event: FormEvent) {
    event.preventDefault();
    const askTitle = title.trim();
    const askBody = body.trim();
    if (!askTitle || !askBody) return;
    setTitle('');
    setBody('');
    try {
      await addDoc(collection(getFirebase().db, 'questions'), {
        uid,
        title: askTitle,
        body: askBody,
        createdAt: serverTimestamp(),
      });
    } catch {
      setError('We could not post your question. Please try again.');
    }
  }

  function startEdit(question: Question) {
    setEditingId(question.id);
    setEditTitle(question.title);
    setEditBody(question.body);
  }

  async function saveEdit(event: FormEvent, id: string) {
    event.preventDefault();
    const nextTitle = editTitle.trim();
    const nextBody = editBody.trim();
    if (!nextTitle || !nextBody) return;
    try {
      await updateDoc(doc(getFirebase().db, 'questions', id), {
        title: nextTitle,
        body: nextBody,
      });
      setEditingId(null);
    } catch {
      setError('We could not save your changes. Please try again.');
    }
  }

  return (
    <section className="flex max-w-sm flex-col gap-3">
      <h2 className="text-lg font-semibold">Ask a question</h2>
      <form onSubmit={ask} className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="rounded border px-2 py-1 text-black"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What would you like to ask?"
          rows={3}
          className="rounded border px-2 py-1 text-black"
        />
        <button type="submit" className="self-start rounded border px-3 py-1">
          Ask
        </button>
      </form>
      {error ? <p role="alert">{error}</p> : null}
      <ul className="flex flex-col gap-3">
        {questions.map((question) =>
          editingId === question.id ? (
            <li key={question.id}>
              <form
                onSubmit={(e) => void saveEdit(e, question.id)}
                className="flex flex-col gap-2"
              >
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded border px-2 py-1 text-black"
                />
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
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
            <li key={question.id} className="flex flex-col gap-1 border-b pb-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{question.title}</span>
                {question.uid === uid ? (
                  <span className="flex gap-2 text-sm">
                    <button className="underline" onClick={() => startEdit(question)}>
                      Edit
                    </button>
                    <button
                      className="underline"
                      onClick={() =>
                        void deleteDoc(doc(getFirebase().db, 'questions', question.id))
                      }
                    >
                      Delete
                    </button>
                  </span>
                ) : null}
              </div>
              <p>{question.body}</p>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
