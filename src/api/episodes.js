const MANIFEST_URL =
  "https://s3.k8s.maayanlab.cloud/axiom-podcasts/manifest.json";

async function getManifest() {
  const res = await fetch(
    `${MANIFEST_URL}?t=${Date.now()}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch manifest");
  }

  return await res.json();
}

export const episodeAPI = {
  async list() {
    const episodes = await getManifest();

    console.log("Fetched manifest:", episodes);

    return [...episodes].sort(
      (a, b) => (b.episode_number || 0) - (a.episode_number || 0)
    );
  },

  async get(id) {
    const episodes = await getManifest();
    return episodes.find(ep => ep.id === id) || null;
  },
};