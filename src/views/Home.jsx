import React, { useState, useEffect } from "react";
import { episodeAPI } from "@/api/episodes";
import HeroSection from "@/components/podcast/HeroSection";
import EpisodeCard from "@/components/podcast/EpisodeCard";
import Footer from "@/components/podcast/Footer";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1];

export default function Home() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    episodeAPI.list()
      .then((episodes) => setEpisodes(episodes.filter((ep) => ep.published !== false)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latestEpisode = episodes[0];

  return (
    <div className="min-h-screen bg-alabaster">
      <HeroSection latestEpisode={latestEpisode} />

      {/* Synthesis Feed */}
      <section className="px-6 md:px-16 py-20 md:py-32 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease }}
          className="mb-16"
        >
          <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-cobalt mb-3">The Archive</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-graphite italic">Synthesis Feed</h2>
          <p className="font-body text-base text-graphite/50 mt-4 max-w-lg">
            Each episode dissects a paper from the Ma'ayan Lab — synthesized into dialogue by our AI hosts.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-graphite/10 border-t-cobalt rounded-full animate-spin" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 mx-auto mb-6 border border-graphite/10 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-cobalt rounded-full animate-pulse" />
            </div>
            <p className="font-mono text-[11px] tracking-widest uppercase text-graphite/40">
              Awaiting first synthesis
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {episodes.map((ep, i) => (
              <EpisodeCard key={ep.id} episode={ep} index={i} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
