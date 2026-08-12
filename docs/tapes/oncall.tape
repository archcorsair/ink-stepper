# ink-stepper docs-gallery recording: oncall.
#
# Regenerate from the repo root (requires vhs, ttyd, a full ffmpeg build, and a
# chromium on PATH; in sandboxed environments run with VHS_NO_SANDBOX=true):
#
#   vhs docs/tapes/oncall.tape
#
# Records examples/gallery/oncall.tsx (seeded data) and writes
# docs/public/oncall.gif, served by the docs site at /oncall.gif.

Output docs/public/oncall.gif

Set Shell "bash"
Set FontSize 15
Set Width 720
Set Height 440
Set Padding 14
Set Framerate 20

Hide
Type "clear && bun examples/gallery/oncall.tsx"
Enter
Sleep 3s
Show

# Triage: arrow onto SEV-1 and watch the Escalate step insert itself,
# back off, then commit to SEV-1
Sleep 1.4s
Down
Sleep 1.4s
Up
Sleep 1s
Down
Sleep 1.2s
Enter

# Mitigate: confirm each action with y
Sleep 1s
Type@450ms "yy"
Sleep 900ms
Enter

# Escalate (the inserted step): page the commander
Sleep 1s
Type "y"
Sleep 1.4s
Enter

# Verify: error rate recovers on its own
Sleep 3.4s
Enter

# Handoff note
Sleep 900ms
Type@110ms "rolled back banner exp"
Sleep 700ms
Enter

# Hold on resolution, quit off-screen
Sleep 3s
Hide
Type "q"
