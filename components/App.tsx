'use client';

import AuthGate from './AuthGate';
import Notes from './Notes';
import Profile from './Profile';
import Questions from './Questions';

export default function App() {
  return (
    <AuthGate>
      {(user) => (
        <>
          <Profile user={user} />
          <Questions uid={user.uid} />
          <Notes uid={user.uid} />
        </>
      )}
    </AuthGate>
  );
}
