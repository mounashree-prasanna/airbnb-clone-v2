import axios from "axios";

const ACCESS_KEY = "YOUR_UNSPLASH_ACCESS_KEY"; 

export async function getUnsplashPhoto(query) {
  try {
    const res = await axios.get("https://api.unsplash.com/photos/random", {
      params: {
        query,
        orientation: "landscape",
        count: 1,
      },
      headers: {
        Authorization: `Client-ID ${ACCESS_KEY}`,
      },
    });

    return res.data[0]?.urls?.regular || "";
  } catch (err) {
    console.error("Unsplash fetch error:", err);
    return "";
  }
}
