---
stet:
  state: draft
  author: agent
---

# stet owner

May I edit this? The question to ask before touching any content file.

```
stet owner <path> [...]
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/owner.mjs <path> [...]
```

This one needs no model, so it ships in the CLI as well as in the plugin. The two lines above do the
same thing.

Writes nothing, and reads nothing but the files you name and their sidecars. The exit code is the
answer and the printed lines are the explanation.

There is no flag parsing. Every argument is treated as a path, so `--help` is looked up as a file of
that name and comes back NO. `stet help owner` is the help.

## The exit codes

| | |
|---|---|
| **0** | every path named may be edited |
| **1** | at least one may not |
| **2** | no path was given, so there was nothing to answer |

Reading the lines is optional. Obeying the code is not. Exit 2 prints the usage line
`owner.mjs <path> [...]` on standard error and checks nothing. Every verdict line goes to standard
output, YES and NO alike, and the usage line is the only thing standard error ever carries.

## What it does, per path, in order

Each argument is made relative to the current directory, so run it from the project root and pass
project paths. An absolute path from somewhere else still works, but it is printed back as the
relative walk it turns into, which is unreadable.

Then it reads the file's stet metadata. A `<path>.stet.yaml` sidecar wins if one exists, and the
sidecar is looked for before the file itself, so a sidecar answers for a file that is not there yet.
Otherwise a `.json` file is read for its `stet` key and anything else for a `stet` block in
frontmatter. A `.json` file whose JSON does not parse reads as no metadata, the same as one with no
`stet` key.

**No metadata means NO.** A file with no record, and a file that does not exist and has no sidecar,
both come back the same way: unclaimed, and the advice is to run `ingest` before editing anything
there.

**Otherwise the state and the policy decide.** `draft` may be edited. So may anything whose policy is
`open`, whatever its state. Everything else is closed and comes back NO.

A record with no `state` line reads as `authored`, which is the safe direction: metadata that forgot
to say gets treated as somebody's writing.

## What the lines say

```
YES   docs/spec.md  (draft)
NO    package.json
        unclaimed. Content with no record belongs to whoever wrote it, which was
        not you. Run ingest before editing anything here.
NO    README.md  (approved)
        An agent wrote this and a person approved it. Approval is what made it theirs.
        You may always propose a rewrite in your reply. Do not put it in the file.
NO    guide.md  (authored, policy: refresh)
        A person wrote this. Do not edit it and do not regenerate it.
        You may bring these facts current and change nothing else: corpus.runs
        You may always propose a rewrite in your reply. Do not put it in the file.
```

A YES is one line: the verdict, the path and the state in brackets. The brackets never carry the
policy, so a closed file you may edit because its policy is `open` looks the same as a draft. A NO
adds the policy in the brackets when the file has one, then who the words belong to. The unclaimed
NO has no brackets, because there is no state to put in them.

The refresh line only appears on a closed file whose policy is `refresh`, and it lists the sources
named in that file's metadata. Policy `open` never reaches it: an open file is a YES. With the
policy set and no sources declared the line prints `none named`, which means the permission exists
and nothing has been put behind it.

The last line is on every NO except the unclaimed one, which stops after the ingest advice. A
rewrite you cannot make is still worth proposing in your reply.

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
