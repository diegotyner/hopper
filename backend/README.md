# Backend

A simple Mongoose+Express Backend.

Meant to practice Node fluency for hackerrank interviews. One of the things I'm emphasizing is the use of Mongoose hooks, idiomatic code separation, and general clean code.

### Future Features:

- Redirect from old slugs to new slugs on rename.
  - Should be a fallback only on failed search.
  - Create a new 'oldSlug' table or something like that
    - Need to think through how to handle sequential name changes so users don't fall through a long redirection pipe (name1->name2->name3->name4...)

- Save hook:
  - Check if document is archived, reject changes if so
  - Needs to check if state transition is valid
  - If title changed, regenerate the slug and make an addition to the oldSlug table
