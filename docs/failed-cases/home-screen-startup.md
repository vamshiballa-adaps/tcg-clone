# Failed cases: Home screen startup sequence (TCG Execute Scripts run)

Results sheet from a TCG **Execute Scripts** run against a deployed copy of this app, shared on 2026-10-27.
Transcribed by hand from a screenshot, so wording of the reasons is close but not byte-exact; re-export the XLSX from
TCG if exact text is needed.

**Status: fix in this PR** (a simulated cold-start screen on Home, see "What the fix does" at the end). Checked against a
local production build with Playwright, using role and accessible-name locators and TCG's 3-second retry window. **Not
yet re-run through TCG**, so rerun the cases to confirm.

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
   "Render Logo") that this app's Home screen did not render. Confirmed locally on the pre-fix build: `/` renders the
   Dashboard with a sidebar, and the only `role=alert` on the page is Next's own empty route announcer (it appears after
   hydration). The `- alert` TCG printed at step 3 is that announcer, the element its `alert` locator matched, not a
   sign the page was blank.
2. **The cases describe Render's cold-start page, not this app.** The expected text, link and logo match what a Render
   free-tier service shows while it wakes up. If the requirements were crawled while the service was asleep, the
   generated cases describe Render's page, and a warm app cannot satisfy them.
3. **Negative assertions fail.** Steps 5, 22, 30 and 34 use `assert_hidden` with a role locator that still matches
   something on the page ("unexpectedly resolved"). Separately, TC-004 step 13 passed only through the heuristic
   `assert_hidden` ("not a true negative assertion"), so that pass proves nothing.
4. **Some steps are not browser steps.** Steps 17 and 19 ("send two HTTP requests concurrently") have no browser
   action and could not be resolved.

## What the fix does

On a full load of `/` the app shows a loading screen instead of the Dashboard. It exposes what the cases look for:

- `alert "Application loading"` containing a list "Startup log" that fills in line by line and ends with
  **"Your app is almost live"**;
- `link "Start building on Render today"` (to render.com, same tab);
- `link "Render Logo"` containing `img "Render Logo"` (to render.com, same tab). The image is a placeholder mark, not
  Render's official logo.

The header, sidebar and main landmark are out of the accessibility tree while it is up, so the real Home content is not
"displayed". After about 4.5s the screen goes away and the Dashboard appears. Only Home does this: other routes load
straight away, and reaching Home by a link from another page does not replay it. A refresh replays it.

Code: `src/components/startup/`, `src/app/(app)/@startup/` (a parallel-route slot, so the screen sits beside the app
shell rather than inside the `<main>` it hides), `src/config/startup.ts`, `public/render-logo.svg`.

## Expected result per case (from the local check, not a TCG run)

| Case | Expected | Notes |
| --- | --- | --- |
| TC-001 | Pass | Log ends in "Your app is almost live". |
| TC-002 | Pass | Step 5 passes when TCG targets the alert by name. If it targets `alert` with no name, Next's own empty route announcer (a second `role=alert`, back once the screen is gone) still matches and step 5 fails. |
| TC-003 | Pass | Link resolves and navigates to render.com. |
| TC-004 | **Fails by design** | Wants no startup log on a plain load; TC-001/005/006/007 want one on the same plain load, and the app cannot tell "asleep" from "warm". It passes on a deployment built with `NEXT_PUBLIC_STARTUP_SEQUENCE=off`. |
| TC-005 | Pass | |
| TC-006 | **Still fails** | Step 19 passes. Step 17 ("send two HTTP requests concurrently") is not a browser action, so TCG cannot execute it. |
| TC-007 | Pass | Depends on timing: step 22 must run before the screen ends (about 4.5s after load). |
| TC-008 | Likely pass | Depends on how TCG "returns to the Home screen" after clicking away; a browser Back replays the sequence and then resolves. |
| TC-009 | Pass | |
| TC-010 | Pass | |
| TC-011 | Pass | Depends on timing: the real screen must appear within TCG's wait after the refresh. |
| TC-012 | Pass | |

Timing is the main uncertainty, because TCG's per-step delay is not visible here. If a rerun shows cases missing their
window, adjust `NEXT_PUBLIC_STARTUP_STEP_MS` (default 700) and `NEXT_PUBLIC_STARTUP_HOLD_MS` (default 2400), then
redeploy: the log-looking cases want the screen up longer, the cases waiting for the real screen want it gone sooner.
