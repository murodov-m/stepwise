# Recording mechanics

Prepared recording: [stepwise-demo.webm](stepwise-demo.webm), 118.083 seconds (1 minute 58 seconds), silent English UI, actual local production app. Idle intervals between captures were shortened; screens and interactions remain in chronological order. It shows the sample, source passage, distinct priority answers, address/readiness guidance, completion through zero remaining actions, and reset. [Sample screenshot](stepwise-sample.jpg) is also included. The public video URL is pending your YouTube upload.

Target: a 130–150 second demonstration; maximum is strictly under three minutes. Show the actual functioning local application with the fictional sample. This is a camera/interaction checklist, not narration or a public pitch. Use your own words if you add a voiceover.

## Preparation
1. Use Node.js 24, `npm ci`, `npm run dev`, and `http://localhost:3000`.
2. Use a clean browser window at 1280×720 or larger. Close unrelated tabs and notifications. Do not show terminal keys, personal documents, account settings, or your private learner profile.
3. Keep the no-key sample selected. It is explicitly deterministic; optional live mode is outside this recording's claims.
4. Record the visible app. No slides, synthetic recreations of the UI, or copyrighted music are needed.

## Visible sequence
| Approximate time | Interaction to capture | Evidence the viewer should see |
| --- | --- | --- |
| 0–15 s | Show the input screen and select Try the sample | No account/key requirement; sample clearly identified |
| 15–40 s | Read results, next action, date, and required documents | Actual document-to-plan result and remaining task count |
| 40–65 s | Open a source passage, show its page/segment context, close it | Inspectable source and uncertainty boundary |
| 65–90 s | Choose Gathering documents, then Meeting the deadline | First action visibly changes with the selected answer |
| 90–115 s | Show readiness question, required documents, and unclear detail warning | Personalization and missing-information handling |
| 115–135 s | Complete the next task | Remaining count and Start here advance |
| 135–145 s | Clear/start a new document | Clean session and input screen |

Pause long enough to read each result. Keep any technical captions short and factual; write your own narration. If the actual interface wording changes, follow the current visible controls rather than recording an outdated script.

## Check before upload
- Play the entire file and inspect the footage, audio if any, and transitions.
- Confirm duration is less than 180 seconds, no credentials/personal content, and actual interaction is visible.
- The prepared file uses WebM/VP8, a YouTube-supported upload format. Keep it until the public link is verified. If you record a replacement with your own recorder, MP4/H.264 is also convenient.
- Follow `youtube-upload.md`; do not mark this requirement complete until the uploaded video is publicly accessible.
