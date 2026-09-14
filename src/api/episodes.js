const MANIFEST_URL =
  "https://s3.k8s.maayanlab.cloud/axiom-podcasts/nci-signal/manifest.json";
const LOCAL_FALLBACK = "/nci-signal-manifest.json";

async function getManifest() {
  try {
    const res = await fetch(
      `${MANIFEST_URL}?t=${Date.now()}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const episodes = await res.json();
      if (Array.isArray(episodes) && episodes.length > 0) {
        return episodes;
      }
    }
  } catch (err) {
    console.warn("Remote manifest unavailable, trying local fallback", err);
  }

  const fallback = await fetch(
    `${LOCAL_FALLBACK}?t=${Date.now()}`,
    { cache: "no-store" },
  );
  if (!fallback.ok) {
    throw new Error("Failed to fetch manifest");
  }
  return await fallback.json();
}

export const episodeAPI = {
  async list() {
    const episodes = await getManifest();
    return [...episodes].sort(
      (a, b) => (b.episode_number || 0) - (a.episode_number || 0)
    );
  },

  async get(id) {
    const episodes = await getManifest();
    return episodes.find(ep => ep.id === id) || null;
  },
};
