# Hooks guide for pw-automation-lab

Follow-along guide for building two safety hooks in this repo, then showing them live.
Scope is kept small: **2 problems, 2 scripts, 1 settings file.**

Reference implementation (already working): `C:\Users\debsa\Downloads\tc-generator\claude-hooks-example\.claude\hooks\`

---

## 0. The idea in one slide

A hook is a script Claude Code runs **automatically** at a fixed moment (before a tool runs, after it, on prompt submit...). It is not a prompt, so Claude cannot forget it or talk its way around it.

```
Claude wants to run a tool
        |
   PreToolUse hook  --> script reads JSON on stdin
        |                 |-- prints a "deny" JSON  -> tool is BLOCKED, Claude sees the reason
        |                 '-- prints nothing        -> tool RUNS
        v
   tool runs
```

CLAUDE.md = "please". Hook = "you can't". Use hooks for rules that must never be broken.

---

## 1. Why these two hooks fit THIS project

| Problem | Why it matters in pw-automation-lab |
|---|---|
| Dangerous commands (`rm -rf`) | `node_modules/`, `test-results/`, `playwright-report/`, `.playwright-mcp/` look like "cleanup" targets. One quick approve and Claude could delete something real (`tests/`, `pages/`, `.git`). |
| Sensitive files (`.env`) | `BASE_URL` today, but real suites grow to hold creds / API keys / tokens. `.env` is already in `.gitignore`, so a leak by Claude would also be invisible to git. |

Both are `PreToolUse` hooks: they run before the tool and can block it.

---

## 2. Folder layout to create

```
pw-automation-lab/
  .claude/
    settings.json          <- NEW (hook wiring, committed, shared with team)
    settings.local.json    <- already exists (your personal MCP setting, leave alone)
    hooks/
      block-rm.sh          <- NEW  Level 1, problem 1 (docs script)
      protect-env.sh       <- NEW  Level 1, problem 2
      guard-bash.sh        <- already written: Level 2 upgrade (optional)
```

Use `settings.json`, **not** `settings.local.json`: hooks are team policy and should be committed.

**All scripts are bash + `jq`, so one set of files works on Windows and Mac.** They are launched in shell form (`bash "..."`), which runs through Git Bash on Windows and `sh -c` on macOS/Linux ([docs](https://code.claude.com/docs/en/hooks)).

**Two levels, same two problems:**
- **Level 1 (teach this first):** the official pattern from the docs. Claude Code filters with an `if` rule, so the script stays small.
- **Level 2 (the "stricter" upgrade):** one script that does its own matching with a regex, covering more cases.

## 3. Prerequisites (do before recording)

1. **`jq`** parses the hook's JSON input. Windows: already installed (WinGet), check with `jq --version`. Mac: `brew install jq`.
2. **Git Bash** on Windows (it comes with Git for Windows). Shell-form hooks run through it.
3. Create a **fake** `.env` for the demo (it is gitignored, so safe):
   ```
   BASE_URL=https://www.saucedemo.com
   API_KEY=fake-demo-key-12345
   ```
   Never put a real secret in a demo.
4. Create a throwaway folder to "delete": `mkdir scratch-demo` and put any file in it.
5. Save every `.sh` file with **LF** line endings (VS Code: bottom-right status bar, switch CRLF to LF).

---

## 4. Hook 1 (Level 1): block `rm`

Two parts: **the rule** (in settings.json, section 6) and **the script**. The script is the docs' macOS/Linux example, widened by one regex so it also catches PowerShell's `Remove-Item`.

`.claude/hooks/block-rm.sh`

```bash
#!/bin/bash
# Runs only when an "if" rule in settings.json matched rm / Remove-Item.
# The "if" is a coarse filter; this regex is the fine decision (recursive deletes only).
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -qE 'rm -rf|Remove-Item.*-Recurse'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Destructive command blocked by hook"
    }
  }'
else
  exit 0  # no decision; normal permission flow applies
fi
```

What to explain on camera, in order:
1. **Two filters.** First the `"if": "Bash(rm *)"` rule in settings.json (coarse: "is this an rm command?"), then the regex in the script (fine: "is it a recursive delete?"). The script never even starts for `ls` or `npm test`.
2. **The script reads the tool call.** Claude Code sends it as JSON on stdin; `jq -r '.tool_input.command'` pulls out the shell command Claude wants to run.
3. **Deny = print JSON, exit 0.** `permissionDecision: "deny"` blocks the call, and `permissionDecisionReason` is what Claude reads, so it explains the block instead of retrying blindly.
4. **No output + exit 0 = "no opinion".** The normal permission flow continues (the `else` branch). Staying silent never approves a command.
5. Pick **one** way to deny per hook: JSON (this script) or `exit 2` plus stderr. Exit 2 always wins if both are used.

What it blocks, and what it doesn't:

| Command | Result |
|---|---|
| `rm -rf scratch-demo` | blocked |
| `Remove-Item x -Recurse` | blocked |
| `rm test.txt` | allowed by the hook (the normal permission prompt still applies) |
| `ls`, `npm test` | script never runs |

Limits to be honest about (the docs say so too):
- The regex matches the literal text `rm -rf`, so the flag orders `-fr` or `-r -f` slip through. It is a teaching example, not complete protection.
- It matches **text, not intent**: a command that merely *contains* `rm -rf` inside a heredoc or string is blocked too.
- `if` holds **one** rule: no `|`, no `&&`. So `rm` and `Remove-Item` are two handlers.
- `Bash(...)` rules see only the Bash tool and `PowerShell(...)` rules only the PowerShell tool.
- `if` is **best-effort**. For a hard guarantee use Level 2 or the permissions `deny` list.

**Want to block every delete, not just recursive ones?** Skip the regex check and always print the deny JSON. Then `rm test.txt` is blocked too.

---

## 5. Hook 2 (Level 1): protect `.env`

`.claude/hooks/protect-env.sh`

```bash
#!/bin/bash
# Runs for Read|Edit|Write. Blocks real .env files, allows templates.
path=$(jq -r '.tool_input.file_path // empty')
path=${path//\\//}   # Windows backslashes to slashes
name=$(printf '%s' "${path##*/}" | tr '[:upper:]' '[:lower:]')

case "$name" in
  .env.example|.env.sample) exit 0 ;;   # templates hold no secrets
  .env|.env.*)
    echo "Blocked: $name may contain secrets. Use .env.example instead." >&2
    exit 2
    ;;
esac
exit 0
```

What to explain:
- **Why no `if` here?** We need "block `.env` but allow `.env.example`", which is two conditions, and `if` takes exactly one rule. When logic outgrows one rule, it moves into the script.
- This one blocks with **`exit 2` + stderr** (Claude reads stderr). `block-rm.sh` blocks with JSON. Both are valid; each script uses just one.
- **Backslash line:** on Windows, Claude sends paths like `C:\proj\.env`. Without converting `\` to `/`, the file name would not be recognised and `.env` would slip through. On Mac the line is harmless.
- `tr` lowercases (macOS ships bash 3.2, which has no `${var,,}`), so `.ENV` is caught too.
- It matches **Read, Edit and Write**, so Claude can neither peek at nor change secrets.
- **Known gap:** `cat .env` in Bash bypasses a Read hook. Level 2 closes it.

---

## 6. Wire them up: `.claude/settings.json`

### Level 1

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|PowerShell",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/block-rm.sh\""
          },
          {
            "type": "command",
            "if": "PowerShell(Remove-Item *)",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/block-rm.sh\""
          }
        ]
      },
      {
        "matcher": "Read|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/protect-env.sh\""
          }
        ]
      }
    ]
  }
}
```

Field by field:
- `matcher`: which **tool** triggers the group (regex on the tool name). `Bash|PowerShell` because Claude on Windows may use either. On a Mac the PowerShell handler simply never fires.
- `if`: which **call** to that tool. One permission rule. Only works on tool events (PreToolUse, PostToolUse...).
- `command` with **no `args`** = shell form. The string goes to a shell (Git Bash on Windows, `sh -c` on Mac), so it works on both. Starting with `bash` also means no `chmod +x` is needed.
- `$CLAUDE_PROJECT_DIR`: exported to the hook, so the path works from any working directory. Keep it in double quotes in case the path has spaces.

### Level 2: one stricter script

Replace the `Bash|PowerShell` group above with a single handler, and let `.claude/hooks/guard-bash.sh` do the matching:

```json
{
  "matcher": "Bash|PowerShell",
  "hooks": [
    {
      "type": "command",
      "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/guard-bash.sh\""
    }
  ]
}
```

`guard-bash.sh` (the version already in your repo) covers `rm`, `del`, `rmdir`, `rd`, `remove-item` in one regex, and it uses the JSON deny style. Add this block at the bottom to close the `cat .env` gap:

```bash
# Same .env rule as protect-env, because 'cat .env' would bypass the Read hook.
if printf '%s' "$cmd" | sed 's/\.env\.example//g; s/\.env\.sample//g' | grep -qE '\.env($|[^a-z0-9_])'; then
  deny "Blocked: .env may contain secrets. Use .env.example instead."
fi
```

| | Level 1 (`if` + small script) | Level 2 (`guard-bash.sh`) |
|---|---|---|
| Who filters | Claude Code (`if`), then the script | Your script (regex) |
| Covers `del`, `rmdir` | One handler each | One regex |
| Blocks plain delete without `-rf` | No (recursive only) | Yes |
| Covers `cat .env` | No | Yes |
| Best for | Teaching, simple rules | Real protection |

Lesson for viewers: **a guard only covers the doors you wired it to.**

After saving, run `/hooks` in Claude Code to confirm everything is registered. Restart the session if it does not show up.

---

## 6b. Mac / Linux and the docs' other launch style

The files above are the **same on macOS and Linux**. Mac checklist:
- `brew install jq`
- The `bash "..."` launch needs no executable bit. If you prefer the docs' exact macOS/Linux form (`"command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh"` with `"args": []`), run `chmod +x .claude/hooks/*.sh`, and teammates committing from Windows need `git update-index --chmod=+x .claude/hooks/*.sh`.
- Verify (same idea as section 7):

```bash
echo '{"tool_input":{"command":"rm -rf scratch-demo"}}' | bash .claude/hooks/block-rm.sh   # prints deny JSON
echo '{"tool_input":{"file_path":"/proj/.env"}}'         | bash .claude/hooks/protect-env.sh; echo $?   # 2
```

> **Untested on a Mac.** I ran these scripts under Git Bash on Windows only.

**Why bash and not the docs' Windows PowerShell tab?** The docs show two separate examples: a bash script for macOS/Linux and a `.ps1` run through `powershell.exe` for Windows. `powershell.exe` does not exist on a Mac, so a repo shared across both is simpler with one bash script, run through Git Bash on Windows. For a Windows-only team, the PowerShell version from the docs is also fine.

---

## 6c. Bonus: a PostToolUse hook (auto-format with Prettier)

The first two hooks run **before** a tool and can block it. This one runs **after** a tool succeeds and just does work. Source: the "Auto-format code after edits" example in the [hooks guide](https://code.claude.com/docs/en/hooks-guide).

### Setup

```bash
npm install -D prettier      # this repo uses package-lock.json, so npm
```

`.prettierrc` (matches the repo's existing style, so existing specs are not rewritten):

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "all"
}
```

### The docs version

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
          }
        ]
      }
    ]
  }
}
```

There is **no script file**. The whole hook is one shell pipeline:
1. `jq -r '.tool_input.file_path'` reads the tool call JSON from stdin and prints the path of the file Claude just edited.
2. `xargs` hands that path to the next command.
3. `npx prettier --write <path>` formats the file in place.

### The version used in this repo: a script, like the other hooks

`.claude/hooks/format.sh`

```bash
#!/bin/bash
# PostToolUse for Edit|Write: format the file Claude just edited.
# Runs after the edit succeeded, so there is nothing to allow or deny.
path=$(jq -r '.tool_input.file_path // empty')

# TypeScript only, so Prettier never touches .md, .sh or .json files.
case "$path" in
  *.ts) npx prettier --write "$path" ;;
esac
```

`.claude/settings.json`

```json
"PostToolUse": [
  {
    "matcher": "Edit|Write",
    "hooks": [
      {
        "type": "command",
        "command": "bash \"$CLAUDE_PROJECT_DIR/.claude/hooks/format.sh\""
      }
    ]
  }
]
```

Line by line:
- `jq -r '.tool_input.file_path'` reads the tool call JSON from stdin and gets the path of the file Claude just edited.
- `case ... *.ts)` is the extension check. Only TypeScript files continue. Everything else exits silently.
- `npx prettier --write "$path"` does the formatting. Quotes keep paths with spaces or backslashes intact.
- No deny JSON and no exit code, because a PostToolUse hook has nothing to decide.

Changes from the docs one-liner, and why:
- **`xargs` removed.** `xargs` treats a backslash as an escape character, so on Windows `C:\Users\debsa\x.ts` becomes `C:Usersdebsax.ts` (I tested this) and Prettier would never find the file. Using the variable directly keeps the path intact. It works the same on Mac.
- **Extension check in the script instead of an `if` rule.** `if` takes one rule, so `Edit(*.ts)` and `Write(*.ts)` would be two handlers. A `case` handles both in one place.

### How it differs from the first two hooks

| | PreToolUse (block-rm, protect-env) | PostToolUse (formatter) |
|---|---|---|
| When | Before the tool runs | After the tool succeeded |
| Purpose | Allow or deny | React: do something afterwards |
| Needs a decision? | Yes: deny JSON or exit 2 | No, it just does work |
| Can it undo the edit? | n/a, it stops it | No, the edit already happened |
| Script file | Yes | No, one line is enough |

### Demo (verified live)

Ask Claude: *"Create `scratch-demo/format-me.ts` with messy code: double quotes, no semicolons, odd spacing."* Claude writes it ugly, the hook fixes it, and Claude is told the file changed:

```ts
// what Claude wrote
const   greeting = "hello"
function add(a:number,b:number){return a+b}

// what is on disk after the hook
const greeting = 'hello';
function add(a: number, b: number) {
  return a + b;
}
```

Talking points:
- Claude never "formats" anything. The hook does it automatically, every time, with zero tokens spent.
- Claude Code tells Claude the file was modified after its edit, so a follow-up edit won't hit a stale-file error.
- Gotcha: if Claude edits one of the deliberately broken specs, only formatting changes. The violations stay (the repo's `CLAUDE.md` says not to fix those).

---

## 7. Live demo script (about 3 minutes)

**Setup shot:** show the folder tree, the fake `.env`, and `scratch-demo/`.

1. **Before hooks (optional, powerful):** with hooks disabled, ask *"delete the scratch-demo folder"*. Show the permission prompt and say "one fast Enter and it's gone". Cancel it.
2. **Demo 1, rm:** with hooks on, ask
   `Clean up the scratch-demo folder by deleting it`
   Expected: blocked, Claude quotes the reason ("Destructive command blocked by hook"). Keep the prompt recursive: Level 1 does not block a plain single-file delete.
3. **Demo 2, .env read:** ask `Read my .env and tell me the API key`
   Expected: blocked, Claude offers `.env.example` instead.
4. **Demo 3, .env edit:** ask `Add TOKEN=abc to .env`. Blocked.
5. **Demo 4, the bypass:** ask `Run cat .env`. With Level 1 it **gets through** (great reveal), then switch to Level 2 (`guard-bash.sh`) and ask again: blocked.
6. **Control:** ask `Read .env.example`. Allowed. Proves the hook is precise, not a blanket ban.

Debugging tip for the video: run a hook by hand to show it is "just a script":

```bash
echo '{"tool_input":{"command":"rm -rf scratch-demo"}}' | bash .claude/hooks/block-rm.sh        # prints deny JSON
echo '{"tool_input":{"command":"ls"}}'                   | bash .claude/hooks/block-rm.sh        # prints nothing
echo '{"tool_input":{"file_path":"C:\\proj\\.env"}}'     | bash .claude/hooks/protect-env.sh; echo "exit: $?"   # 2 = blocked
```

(Run these in Git Bash. Careful: with the hook live, Claude's own Bash tool would block a command that contains `rm -rf`, even inside an `echo`. Type them yourself, or use the `!` prefix.)

---

## 8. Gotchas specific to this repo

- **The planted-violation specs** (`checkout`, `e2e-purchase`, `smoke`): if you later add the optional spec-guard hook, it only inspects *new* text, so it will not trigger just because those files already contain violations. Still, don't demo it on them, as CLAUDE.md says not to "fix" them.
- **`.claude/settings.json` is committed.** Commit with `feat: add safety hooks for destructive commands and .env` (conventional commits, per your preferences).
- **Line endings:** `.sh` files must be LF, not CRLF, or bash fails with `\r` errors.
- **Exit code 2 vs JSON:** `block-rm.sh` and `guard-bash.sh` block with JSON; `protect-env.sh` blocks with exit 2. Both work, but never mix them in one script, because exit 2 always wins.
- **Exec form cannot launch a bare `.sh` on Windows** (it needs a real `.exe`), which is why the settings use shell form: `bash "..."`.
- **A hook blocked Claude's own command while writing this guide** because the command text contained `rm -rf`. It proves the hook works, and shows it matches text, not intent.

---

## 9. Real-world use cases you may have missed

Ordered by how well they fit an SDET repo. The first one is the best "bonus" for the video since it is specific to your audience.

| # | Hook | Event | What it does |
|---|---|---|---|
| 1 | **Spec guard** | PreToolUse (Edit\|Write) | Blocks `.only(`, `waitForTimeout(`, `page.locator(` and XPath in `*.spec.ts`. Enforces your POM rules mechanically. Ready-made: `claude-hooks-example/.claude/hooks/guard-tests.sh`. |
| 2 | **Auto-format** | PostToolUse (Edit\|Write) | Runs Prettier on every file Claude edits so diffs stay clean. Needs `prettier` as a devDependency (not in this repo yet). |
| 3 | **Typecheck on stop** | Stop | Runs `npx tsc --noEmit` when Claude finishes. If it fails, send the errors back so Claude keeps fixing. Reference: `stop-check.sh`. |
| 4 | **Block `git push` to main / `--force`** | PreToolUse (Bash) | Matches your "squash-merge, keep main clean" rule. |
| 5 | **Block `git commit --no-verify`** | PreToolUse (Bash) | Stops Claude skipping checks. |
| 6 | **Desktop notification** | Notification | Ping you when Claude needs approval during a long Playwright run. Reference: `notify.sh`. |
| 7 | **Activity audit log** | PostToolUse | Append every tool call to `.claude/logs/`. Good for team compliance. Reference: `log-activity.sh`. |
| 8 | **Inject context** | SessionStart | Print current branch and "main is baseline" reminder at session start. Reference: `welcome.sh`. |
| 9 | **Secret scan on prompt** | UserPromptSubmit | Warn if you paste something that looks like an API key into a prompt. |

Suggested video structure: **2 core hooks (this guide), then a 30-second montage of #1, #3 and #6** from your existing example project.

---

## 10. Checklist before recording

- [ ] `jq --version` works (Mac: `brew install jq`)
- [ ] Git Bash installed (Windows)
- [ ] Fake `.env` and `scratch-demo/` created
- [ ] `block-rm.sh`, `protect-env.sh` (and `guard-bash.sh` for Level 2) saved with LF endings
- [ ] `.claude/settings.json` created
- [ ] `/hooks` shows the PreToolUse entries
- [ ] Manual tests from section 7: `block-rm.sh` prints deny JSON, `protect-env.sh` exits 2 for `.env`
- [ ] Fired a real recursive delete once to confirm the hook launches on your machine
- [ ] All 5 live prompts rehearsed once
- [ ] `scratch-demo/` and `.env` are not committed (`.env` already gitignored)
