# Failed cases: Home screen startup sequence (TCG Execute Scripts run)

Results sheet from a TCG **Execute Scripts** run against a deployed copy of this app, shared on 2026-10-27.
Transcribed by hand from a screenshot, so wording of the reasons is close but not byte-exact; re-export the XLSX from
TCG if exact text is needed.

**Status: open.** Nothing in the app has been changed to address these yet.

## Result

- 12 test cases, 43 steps: **31 passed, 12 failed**.
- Fully passing cases: TC-004, TC-011. The other 10 cases each have at least one failed step.

## Test cases

| ID | Title |
| --- | --- |
| TC-001 | Verify that the Home screen displays the startup log text sequence culminating in 'Your app is almost live' when the service is asleep |
| TC-002 | Verify that the Application loading state resolves to the actual application content once the service finishes initializing on the Home screen |
| TC-003 | Verify that clicking the link Start building on Render today navigates the browser to a Render-related destination from the Home screen |
| TC-004 | Verify that the Home screen does NOT display the startup log sequence when the underlying web service is not in a cold start or sleeping state (passes) |
| TC-005 | Verify that the startup log text sequence displays progressively on the Home screen consistent with the Application loading during a cold start |
| TC-006 | Verify that two simultaneous requests to the root URL during a cold start each display the startup log sequence ending with Your app is almost live |
| TC-007 | Verify that the Application loading state remains displayed on the Home screen when the underlying service has not yet finished initializing |
| TC-008 | Verify that the loading screen still resolves to the actual application content if the user clicks the link Start building on Render today during the startup log sequence |
| TC-009 | Verify that clicking the link Start building on Render today on the Home screen navigates the browser to a Render-related destination during the loading sequence |
| TC-010 | Verify that clicking the Render Logo link on the Home screen during the loading sequence navigates to Render's homepage or branding destination |
| TC-011 | Verify that refreshing the Home screen while the cold start loading sequence is in progress still results in the sequence resolving to the application content (passes) |
| TC-012 | Verify that clicking the img Render Logo on the Render - Home screen navigates to Render's homepage or branding destination |

## The 12 failed steps

| Case | Step | Step description | Action | Reason reported by TCG |
| --- | --- | --- | --- | --- |
| TC-001 | 3 | Verify the text sequence culminates in 'Your app is almost live' | assert_text (get_by_role) | Element found but not interactable after 3 attempts. Locator expected to contain text 'Your app is almost live'; actual value was empty. The locator resolved to `<div role="alert" aria-live="assertive" id="__next-route-announcer__">`. Aria snapshot was only `- alert`. |
| TC-002 | 5 | Wait for the startup log text sequence to complete on the Home screen | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
| TC-003 | 9 | Click the link Start building on Render today | (none) | Our system found no plausible match (after retries) |
| TC-005 | 16 | Verify the startup log text sequence appears progressively alongside the text 'Application loading' | assert_visible | Unresolved after 3 attempts (role `alert`, name 'Application loading'). get_by_role, get_by_label, get_by_text, get_by_attribute and the page-level variants all reported no match. |
| TC-006 | 17 | Send two HTTP requests to the root URL concurrently while the service is asleep | (none) | Our system found no plausible match (after retries) |
| TC-006 | 19 | Verify each request's Home screen displays the startup log sequence ending in 'Your app is almost live' | (none) | Our system found no plausible match (after retries) |
| TC-007 | 22 | Verify the actual application content is not displayed while the service has not finished initializing | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
| TC-008 | 24 | Click the link Start building on Render today while the startup log sequence is still displaying | (none) | Our system found no plausible match (after retries) |
| TC-009 | 29 | Click the link Start building on Render today | (none) | Our system found no plausible match (after retries) |
| TC-009 | 30 | Verify the browser navigates away from the Home screen | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
| TC-010 | 34 | Verify the browser navigates away from the Home screen | assert_hidden | Element unexpectedly resolved via get_by_role; should have been hidden |
| TC-012 | 41 | Verify the img "Render Logo" is displayed on the Render - Home screen | (none) | Our system found no plausible match (after retries) |

## Failure patterns (hypotheses, not confirmed)

1. **The tested page does not contain the expected content.** Steps 3, 9, 16, 24, 29 and 41 look for text or elements
   ("Your app is almost live", a link "Start building on Render today", an alert named "Application loading", an img
   "Render Logo") that this app's Home screen does not render. The only thing in the aria snapshot at step 3 was the
   Next.js route announcer, so the page tree was essentially empty at that moment.
2. **The cases describe Render's cold-start page, not this app.** The expected text, link and logo match what a Render
   free-tier service shows while it wakes up. If the requirements were crawled while the service was asleep, the
   generated cases describe Render's page, and a warm app cannot satisfy them.
3. **Negative assertions fail.** Steps 5, 22, 30 and 34 use `assert_hidden` with a role locator that still matches
   something on the page ("unexpectedly resolved"). Separately, TC-004 step 13 passed only through the heuristic
   `assert_hidden` ("not a true negative assertion"), so that pass proves nothing.
4. **Some steps are not browser steps.** Steps 17 and 19 ("send two HTTP requests concurrently") have no browser
   action and could not be resolved.

## What passing would take (decision needed)

- Either the app grows a startup/loading screen on Home that these cases can see (a startup log text sequence ending in
  "Your app is almost live", an alert named "Application loading", a link "Start building on Render today", an img
  "Render Logo"), which conflicts with TC-004 (no sequence when the service is warm) and cannot satisfy TC-006's
  concurrent HTTP requests;
- or the requirements are regenerated from a warm deployment so the cases describe this app.
