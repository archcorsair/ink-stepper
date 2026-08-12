# ink-stepper README hero recording.
#
# Regenerate from the repo root (requires vhs, ttyd, a full ffmpeg build, and a
# chromium on PATH; in sandboxed environments run with VHS_NO_SANDBOX=true):
#
#   vhs docs/tapes/wizard.tape
#
# Records examples/demo.tsx (seeded data - output is reproducible) and writes
# docs/public/wizard.gif, which the docs site serves at /wizard.gif.

Output docs/public/wizard.gif

Set Shell "bash"
Set FontSize 15
Set Width 720
Set Height 440
Set Padding 14
Set Framerate 20

Hide
Type "clear && bun examples/demo.tsx"
Enter
Sleep 3s
Show

# Step 1: Project - let the pulsing marker breathe, then type at human speed
Sleep 1.6s
Type@120ms "ink-notes"
Sleep 800ms
Enter

# Step 2: Stack - arrow-select
Sleep 1200ms
Down
Sleep 700ms
Enter

# Step 3: Team - fail validation first, hold on the error, then correct it
Sleep 1200ms
Type@115ms "dev@local"
Sleep 600ms
Enter
Sleep 1400ms
Sleep 1800ms
Backspace@85ms 9
Sleep 400ms
Type@110ms "mara@sable.dev"
Sleep 700ms
Enter
Sleep 1600ms

# Step 4: Review - read, then create
Sleep 1600ms
Enter

# Completion - hold on the success state, then quit off-screen
Sleep 3s
Hide
Type "q"
