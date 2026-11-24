# Avatar test (Digital Traveler)

Self-contained test: a visitor gives consent, takes a selfie, and fal's FLUX PuLID model (`fal-ai/flux-pulid`) turns it into a 3D "Digital Traveler" with a "Proudly AI-Signed" band.

It does not touch the main contact page (`index.html`, `config.js`) or the QR code. To remove it, delete this folder and its Railway service.

## How it works
- `public/index.html` is the page (consent, camera or upload, loading, result, download).
- `server.js` is a tiny Node server. It serves the page and has one route, `POST /api/avatar`, which calls fal.
- The fal key (`FAL_KEY`) lives only on the server. The browser never sees it.
- Photos are not saved. The result comes back as a data URI (`sync_mode`), so it is not kept in fal's request history either.
- A simple limit allows 5 generations per visitor IP every 10 minutes.

## Run locally
1. `cd avatar-test && npm install`
2. Get a fal key (see below) into `avatar-test/.env`, then `chmod 600 .env`.
3. `npm start` and open http://localhost:3000. The camera works on localhost and on HTTPS.

## Get the fal key (fal's approval flow, run in your own terminal from `avatar-test/`)
```bash
# 1. Start the connection
curl -s -X POST https://fal.ai/api/agent-connect -H 'Content-Type: application/json' \
  -d '{"name":"mission-possible-avatar-test"}' > /tmp/fal-connect.json
# Open the verification_uri_complete link it shows, check the user_code matches, approve.
grep -o '"user_code":"[^"]*"\|"verification_uri_complete":"[^"]*"' /tmp/fal-connect.json

# 2. Poll until approved, then append the FAL_KEY line to .env without printing it
DC=$(sed -n 's/.*"device_code":"\([^"]*\)".*/\1/p' /tmp/fal-connect.json)
touch .env && chmod 600 .env
for i in $(seq 1 200); do
  code=$(curl -s -o /tmp/fal-token.txt -w '%{http_code}' -X POST https://fal.ai/api/agent-connect/token \
    -H 'Content-Type: application/json' -d "{\"device_code\":\"$DC\"}")
  if [ "$code" = 200 ]; then grep -q '^FAL_KEY=' .env || { cat /tmp/fal-token.txt >> .env; echo >> .env; }; echo "Key saved"; break; fi
  if [ "$code" = 410 ]; then echo "Denied or expired"; break; fi
  case "$code" in 202|429|5*|000) sleep 3 ;; *) echo "Stopped: HTTP $code"; break ;; esac
done
rm -f /tmp/fal-token.txt /tmp/fal-connect.json
grep -q '^FAL_KEY=' .env && echo "FAL_KEY present"
```
You can see or revoke the key under "mission-possible-avatar-test (agent)" at https://fal.ai/dashboard/keys.
Alternatively, create a key in that dashboard and paste it into `.env` as `FAL_KEY=...`.

## Deploy on Railway (separate service, main site unaffected)
1. In the Railway project, add a new service from the same GitHub repo.
2. Set the service's Root Directory to `avatar-test`. Start command: `npm start`.
3. Use a separate key for deployment (repeat the flow with name `mission-possible-avatar-test deploy`) and add it under the service's Variables as `FAL_KEY`.
4. Give the service its own domain (for example `avatar.sas-wpssession.com`).

## Cost
Each "Create my avatar" is one billable fal call. A 403 with "Exhausted balance" means the fal account needs credits.
