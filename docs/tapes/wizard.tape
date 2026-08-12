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

# Step 1: Project - let the pulsing marker breathe, then type the name
Sleep 1.2s
Type@70ms "ink-notes"
Sleep 600ms
Enter

# Step 2: Stack - arrow-select
Sleep 900ms
Down
Sleep 500ms
Enter

# Step 3: Team - fail validation first, hold on the error, then correct it
Sleep 900ms
Type@60ms "dev@local"
Sleep 400ms
Enter
Sleep 1300ms
Sleep 1600ms
Backspace@45ms 9
Sleep 300ms
Type@55ms "mara@sable.dev"
Sleep 500ms
Enter
Sleep 1500ms

# Step 4: Review - read, then create
Sleep 1300ms
Enter

# Completion - hold on the success state, then quit off-screen
Sleep 2500ms
Hide
Type "q"
