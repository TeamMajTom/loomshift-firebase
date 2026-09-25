# 0001: Author follow/connect is out of scope for the first release

## Status

Decided

## Context

The issue asked whether authors should be able to follow or connect with
specific other authors, or whether voting/asking on ideas is enough to start.

## Decision

Voting and asking on ideas is enough for the first release. A social graph
(following/connecting authors) is explicitly **out of scope for the MVP** and
is deferred to a fast-follow once engagement data justifies it.

Concretely:

- The MVP ships an Idea Feed, Idea Detail, and a minimal Author Profile
  (display name, join date, their public ideas). No follow/connect action is
  available anywhere in the MVP.
- The Author Profile reserves space for a follow button, but it stays
  disabled/hidden until the fast-follow.
- A "Following" feed sort/tab is planned but hidden until follows exist.

## Consequences

- No `follows` data model, Firestore rules, or UI for following authors ships
  in this release.
- The Author Profile's follow button placeholder should stay disabled/hidden
  rather than removed, so the fast-follow can add it without a design change.
