// api/spotify-auth.js
export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }

  const creds = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
  ).toString("base64");

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${creds}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://mood-garden-alpha.vercel.app/",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Spotify token exchange failed:", tokenData);
      return res.status(400).json(tokenData);
    }

    const token = tokenData.access_token;

    // 2. Fetch user profile
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profile = await profileRes.json();

    // 3. Fetch user albums (handle paging)
    let albums = [];
    let next = "https://api.spotify.com/v1/me/albums?limit=50";

    while (next) {
      const albumRes = await fetch(next, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await albumRes.json();
      if (data.items) {
        albums.push(...data.items.map((i) => i.album.name));
      }
      next = data.next;
      if (albums.length > 500) break; // safety cap
    }

    // 4. Return combined data
    res.status(200).json({
      user: profile.display_name || "Spotify User",
      albums,
    });
  } catch (err) {
    console.error("Error in spotify-auth:", err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
}
