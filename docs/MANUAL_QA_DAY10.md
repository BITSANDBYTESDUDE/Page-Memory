# PageMemory Day 10 Manual QA Checklist

## Setup

- [ ] Run `npm install`.
- [ ] Run `npm run build`.
- [ ] Load the `dist/` directory as an unpacked extension in `chrome://extensions`.
- [ ] Enable Developer mode and confirm there are no extension errors.

## Metadata and URL normalization

- [ ] Open a normal HTTPS article and confirm title, canonical URL, domain, and favicon metadata are detected.
- [ ] Open a page with a relative canonical link and confirm it resolves against the page URL.
- [ ] Open a URL with a fragment and query string; confirm the fragment is ignored for page identity while the query is preserved.
- [ ] Confirm credentials are not retained in normalized stored URLs.
- [ ] Confirm unsupported/private schemes are not saved.

## Save and persistence

- [ ] Save a page from the PageMemory popup.
- [ ] Scroll continuously for at least 10 seconds and confirm the page remains responsive.
- [ ] Confirm progress and scroll position update after scrolling stops, without a storage write for every scroll event.
- [ ] Confirm `lastReadAt` updates.
- [ ] Refresh the page and confirm no duplicate saved record is created.
- [ ] Open an unsaved page and confirm scrolling does not create a record.
- [ ] Switch tabs, return to the saved page, and confirm the latest position is retained.
- [ ] Navigate away and back, then confirm the final position is retained where the browser permits lifecycle delivery.

## Restoration

- [ ] On a saved long page, refresh while near the middle and confirm restoration waits briefly before scrolling.
- [ ] Confirm the restored position is close to the last saved position.
- [ ] Add or trigger late-loading content and confirm restoration retries without a large jump.
- [ ] Manually scroll before restoration completes and confirm PageMemory does not override the user’s scroll.
- [ ] Test a page that never becomes tall enough; confirm the page remains usable and does not jump to the bottom.
- [ ] Test a short page and confirm restoration safely resolves to the available range.

## SPA navigation

- [ ] On a React, Next.js, or Vue application, trigger `history.pushState` navigation and confirm tracking restarts for the new URL.
- [ ] Trigger `history.replaceState` navigation and confirm the new logical page is tracked.
- [ ] Use browser Back/Forward and confirm `popstate` navigation is detected.
- [ ] Click an in-page anchor and confirm hash navigation is detected without restoration overriding the anchor target.
- [ ] Trigger the same URL navigation twice and confirm it does not create duplicate tracking behavior.
- [ ] Navigate rapidly between routes and confirm an older route’s restoration cannot jump the current page.

## Regression checks

- [ ] Open the popup and options page; confirm both render normally.
- [ ] Inspect the extension service worker console for uncaught errors.
- [ ] Confirm no duplicate event listeners appear after multiple SPA navigations.
- [ ] Confirm the extension remains usable when Chrome storage is temporarily unavailable.
