# Podcast Integration TODO

**Decision:** Add — implemented as an app-local independent player.
**Status:** ✅ Independent player added 16 September 2026.
**Topic bank:** fantasy literature, storytelling craft, worldbuilding, literary analysis, reading life.

## Completed
- [x] Store 25 legitimate Spotify discussion/analysis episodes inside this repository; no pirated audiobook sources.
- [x] Add a collapsed **🎧 Podcasts** launcher and local embedded Spotify player.
- [x] One tap opens the player; **📖 Different podcast** avoids immediate/recent repeats.
- [x] Persist current/recent selections in `localStorage`.
- [x] Use Spotify embed/deep links without assuming autoplay.
- [x] Close the panel if HTML audio/video begins playing so gameplay/audio remains primary.
- [x] Remove any need for JoshHub, jsDelivr, shared podcast scripts or remote podcast JSON at runtime.
- [x] Keep episode data separate from player logic through local `public/podcast-data.js` and `public/podcast-player.js` modules.

## Future
- [ ] Add browser-level mobile/accessibility regression tests.
- [ ] Replace or supplement broad literature episodes with more specifically Kingkiller/fantasy discussion episodes when verified Spotify IDs are available.
