# Testing on multiple computers

## Option A — Local network (same Wi-Fi, fastest)

Run everything on one "host" computer; other devices reach it over Wi-Fi.

1. **Find the host computer's LAN IP**
   - Windows: `ipconfig` → look for "IPv4 Address" (e.g. `192.168.1.50`)
   - Mac: `ipconfig getifaddr en0`

2. **Start the backend** (binds to all interfaces already):
   ```
   cd backend
   python wsgi.py
   ```

3. **Point the frontend at the host IP.** In the project root create a file
   named `.env` containing:
   ```
   VITE_API_URL=http://192.168.1.50:5000
   ```
   (use your host's IP from step 1)

4. **Start the frontend on the network:**
   ```
   npm run dev
   ```
   Vite prints a "Network:" URL like `http://192.168.1.50:5173`.

5. **On the other computers**, open `http://192.168.1.50:5173` in a browser.
   Log in with the demo accounts (admin / lead / contractor) and test.

Notes:
- All devices must be on the **same Wi-Fi/network**.
- If it won't connect, the host's **firewall** is likely blocking ports 5000/5173 —
  allow them (Windows: "Allow an app through firewall" for Python and Node).
- The host computer must stay on and running both servers.

## Option B — Cloud deploy (any location, real users)

Use this for testers who aren't on your network. See `DEPLOYMENT.md`:
- Backend + Postgres on Render, frontend on Vercel.
- Set `VITE_API_URL` on Vercel to your Render API URL.
- Share the Vercel link — works on any device, anywhere.

This is the right setup for a real pilot and for testing under load.
