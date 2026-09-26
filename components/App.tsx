'use client';

import AuthGate from './AuthGate';
import Notes from './Notes';
import Profile from './Profile';

export default function App() {
  return (
    <AuthGate>
      {(user) => (
        <>
          <Profile user={user} />
          <Notes uid={user.uid} />
        </>
      )}
    </AuthGate>
  );
}
