# Work Log Policy

This project keeps a Markdown work log so that decisions, changes, and context can be reviewed later.

## Location

Daily logs are saved under:

```text
docs/work-log/YYYY-MM-DD.md
```

Example:

```text
docs/work-log/2026-06-23.md
```

## What To Record

Each work log should include, as appropriate:

- Purpose of the work
- What was changed or investigated
- Main files touched
- Important implementation or design points
- Verification results
- Remaining tasks or next steps

## Suggested Daily Template

```md
# Work Log: YYYY-MM-DD

## Purpose

Describe what this session was trying to accomplish.

## Work Done

- Summarize concrete changes, checks, or investigation steps.

## Key Points

- Record decisions, reasons, caveats, or context worth remembering.

## Main Files

- `path/to/file`

## Verification

- Record commands run, build/test results, or manual checks.

## Next Steps

- Note follow-up items or unresolved questions.
```

## Operation

At the start of a new work session, review this policy when work logging is relevant.

At the end of a session, or whenever the user asks to save progress, append a concise but useful summary to that day's log file.

Logs should be practical rather than exhaustive: enough detail to recover the purpose, important choices, and current state without replaying the whole conversation.
