# ink-stepper docs-gallery recording: atlas.
#
# Regenerate from the repo root (requires vhs, ttyd, a full ffmpeg build, and a
# chromium on PATH; in sandboxed environments run with VHS_NO_SANDBOX=true):
#
#   vhs docs/tapes/atlas.tape
#
# Records examples/gallery/atlas.tsx (seeded data) and writes
# docs/public/atlas.gif, served by the docs site at /atlas.gif.

Output docs/public/atlas.gif

Set Shell "bash"
Set FontSize 15
Set Width 720
Set Height 440
Set Padding 14
Set Framerate 20

Hide
Type "clear && bun examples/gallery/atlas.tsx"
Enter
Sleep 3s
Show

# Plan: read the schema diff
Sleep 2.2s
Enter

# Dry run: checks run on their own
Sleep 3.2s
Enter

# Confirm: the typed gate - pause mid-name so the indicator reads
Sleep 1.2s
Type@110ms "prod-"
Sleep 900ms
Type@110ms "billing"
Sleep 1s
Enter

# Apply drives itself to completion
Sleep 3.6s

# Hold on the migrated state, quit off-screen
Sleep 3s
Hide
Type "q"
