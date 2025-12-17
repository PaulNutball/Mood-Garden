// api/spotify-auth.js
export default async function handler(req, res) {
  const code = req.query.code;
  if (!code) {
    res.status(400).json({ error: "Missing code parameter" });
    return;
  }

  const creds = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
  ).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
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

    const text = await response.text();
    console.log("Spotify token response:", text); // 👈 log the raw response
    const data = JSON.parse(text);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching Spotify token:", err);
    res.status(500).json({ error: "Server error", detail: err.message });
  }
}

