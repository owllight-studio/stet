---
stet:
  state: draft
  author: agent
---

# stet owner

May I edit this? The question to ask before touching any content file.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/owner.mjs <path> [...]
```

Writes nothing, reads nothing but the files you name. The exit code is the answer and the printed
lines are the explanation.

## The exit codes

| | |
|---|---|
| **0** | every path named may be edited |
| **1** | at least one may not |
| **2** | no path was given, so there was nothing to answer |

Reading the lines is optional. Obeying the code is not. Exit 2 prints the usage line
`owner.mjs <path> [...]` on standard error and checks nothing.

## What it does, per path, in order

Each argument is made relative to the current directory, so run it from the project root and pass
project paths. An absolute path from somewhere else still works, but it is printed back as the
relative walk it turns into, which is unreadable.

Then it reads the file's stet metadata. A `<path>.stet.yaml` sidecar wins if one exists. Otherwise a
`.json` file is read for its `stet` key and anything else for a `stet` block in frontmatter.

**No metadata means NO.** A file with no record, and a file that does not exist at all, both come
back the same way: unclaimed, and the advice is to run `ingest` before editing anything there.

**Otherwise the state and the policy decide.** `draft` may be edited. So may anything whose policy is
`open`, whatever its state. Everything else is closed and comes back NO.

A record with no `state` line reads as `authored`, which is the safe direction: metadata that forgot
to say gets treated as somebody's writing.

## What the lines say

```
YES   docs/spec.md  (draft)
NO    README.md  (approved)
        An agent wrote this and a person approved it. Approval is what made it theirs.
        You may always propose a rewrite in your reply. Do not put it in the file.
NO    guide.md  (authored, policy: refresh)
        A person wrote this. Do not edit it and do not regenerate it.
        You may bring these facts current and change nothing else: corpus.runs
        You may always propose a rewrite in your reply. Do not put it in the file.
```

A YES is one line: the verdict, the path and the state in brackets. A NO adds the policy in the
brackets when the file has one, then who the words belong to.

The refresh line only appears on a closed file whose policy is `refresh` or `open`, and it lists the
sources named in that file's metadata. With the policy set and no sources declared it prints `none
named`, which means the permission exists and nothing has been put behind it.

The last line is on every NO. A rewrite you cannot make is still worth proposing in your reply.

## What it does not look at

**`stet.config.json`.** This command never opens it, so it answers for any path you hand it,
including code and files no content glob covers. The hook is the part that checks globs. A NO here on
a file outside the content globs is the metadata's answer, not an enforcement.

**The `owned` list.** Per-sentence ownership is invisible to this command. A `draft` file carrying
sentences a person wrote comes back YES, and the hook is what refuses the edit that touches one of
those sentences. Treat a YES as permission to edit the file, not as a claim that every sentence in it
is yours.

**Whether the state is one Stet knows.** An unrecognised state is closed, because it is not `draft`,
and it is described with the approved wording whether or not that is what happened. `doctor` is the
command that reports states this version does not know.

## Never

- Never edit a file this command said NO to, on the grounds that the reason given looks wrong. Fix
  the metadata first, in the open, or say in your reply what you would have changed.
- Never read the printed lines and skip the exit code. A run over several paths exits 1 if any one of
  them is closed, and the YES lines are still in the output above it.
- Never take a YES as covering the sentences inside the file. Ownership is per sentence and this
  command does not read it.

## Done when

Every content file you are about to touch has been named to this command in this session, and every
one of them came back YES.
