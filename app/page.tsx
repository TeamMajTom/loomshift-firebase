import App from '@/components/App';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Your app</h1>
      <p>
        Sign in, then ask a question. It is saved to Firestore under your account and shows up in
        the public question list right away, and you can edit or delete only your own.
      </p>
      <App />
    </main>
  );
}
