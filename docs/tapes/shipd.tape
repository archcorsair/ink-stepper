# ink-stepper docs-gallery recording: shipd.
#
# Regenerate from the repo root (requires vhs, ttyd, a full ffmpeg build, and a
# chromium on PATH; in sandboxed environments run with VHS_NO_SANDBOX=true):
#
#   vhs docs/tapes/shipd.tape
#
# Records examples/gallery/shipd.tsx (seeded data) and writes
# docs/public/shipd.gif, served by the docs site at /shipd.gif.

Output docs/public/shipd.gif

Set Shell "bash"
Set FontSize 15
Set Width 720
Set Height 440
Set Padding 14
Set Framerate 20

Hide
Type "clear && bun examples/gallery/shipd.tsx"
Enter
Sleep 3s
Show

# Fully hands-free: the pipeline drives itself. Just watch.
Sleep 12s

# Hold on the shipped state, then quit off-screen
Sleep 3s
Hide
Type "q"
