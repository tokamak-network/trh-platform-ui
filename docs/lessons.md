# Lessons

- Implementation-facing documents for agents must align with the current repository structure exactly. If the repo uses `src/app` and feature slices, specs that mention `src/pages` or top-level shared components as defaults create avoidable execution errors.
- Agent-executable specs must state the test strategy explicitly. If the repository has no test runner, the document must call out the prerequisite tooling to add before asking for implementation completion.
