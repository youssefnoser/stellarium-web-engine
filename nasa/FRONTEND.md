# SPHEREx frontend

Aladin Lite has been removed. The app uses Next.js, React, TypeScript, native WebGL with a Canvas 2D fallback, and CSS. No external survey tiles are loaded.

Search accepts preset object names or decimal RA/Dec pairs. The sky is simulated. Timeline playback, speed and zoom rotors, six detectors with 17 bands each, and stacking from 1 to 102 are available directly. The sidebar and compass are removed.

Run `npm run dev` for local development, `npm run build` for production, `npm run check` for TypeScript, and `npm test` for zoom, detector mapping, and SVG hydration regressions. Playwright browser checks use Microsoft Edge.


## Observation tools removal

Removed the Observation tools panel and button. Sample JSON API utilities, search history, URL access, timeline, zoom and band controls remain available.

Added a compact FOV input (1.25 to 8.33 arcmin), with Apply/Enter and blur submission. It stays synchronized with rotor and wheel zoom, and changes zoom around the viewport center. The simulated angular scale remains illustrative.

Fixed search history button styling and hid search status while the suggestions panel is open. FOV now validates and applies on Apply/Enter, avoiding zoom changes on blur. Added compact Image math controls for summing selected sample bands in the current and reference frame, then adding or subtracting those images. The processed preview follows timeline and band changes; blue is positive and orange negative. All processed pixels are synthetic, independently normalized, and displayed in a separate preview.

Removed the standalone FOV input and Apply button at user request.

Moved Image math into a full-height sliding left sidebar, with a compact trigger, backdrop dismissal, Escape support, focus management, inert hidden content and reduced-motion support. Processing state persists when closed.

Renamed the processing sidebar to Advanced. Updated form controls with full-width fields, larger spacing, custom chevrons, and subtle hover and keyboard-focus states.

Renamed the drawer to Advanced options and removed question-mark glyphs and the search icon. Search submits with Enter.
