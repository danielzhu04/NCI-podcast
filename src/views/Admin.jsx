import React, { useState, useEffect } from "react";
import { episodeAPI } from "@/api/episodes";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/podcast/Footer";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1];

export default function Admin() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pendingEpisodes, setPendingEpisodes] = useState([]);
  const [form, setForm] = useState({
    publication_url: "",
    tool_url: "",
    image_url: "",
  });
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  async function login() {
    setAuthError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthenticated(true);
    else setAuthError("Wrong password");
  }

  async function fetchPending() {
    try {
      const episodes = await episodeAPI.list();
      
      console.log("ALL EPISODES:", episodes);

      const unpublished = episodes.filter(
        (ep) => ep.published === false
      );

      console.log("UNPUBLISHED:", unpublished);

      setPendingEpisodes(unpublished);
    } catch (err) {
      console.error("fetchPending failed:", err);
    }
  }

  useEffect(() => {
    if (authenticated) fetchPending();
  }, [authenticated]);

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit() {
    if (!pdfFile) {
      setStatus("error");
      setMessage("Please select a PDF file");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const formData = new FormData();
    formData.append("pdf", pdfFile);
    formData.append("publication_url", form.publication_url);
    formData.append("tool_url", form.tool_url);
    formData.append("image_url", form.image_url);

    try {
      const res = await fetch("/api/podcasts/generate", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(typeof data.error === "string" ? data.error : "Failed to queue job");
        return;
      }

      setStatus("success");
      setMessage(`Queued. Job id: ${data.job_id}`);
      setPdfFile(null);
      setForm({ publication_url: "", tool_url: "", image_url: "" });
    } catch (e) {
      setStatus("error");
      setMessage("Network error — could not reach the server");
    }
  }

  const isSubmitting = status === "submitting";

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-alabaster flex items-center justify-center">
        <div className="max-w-sm w-full px-6 space-y-4">
          <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-cobalt">Admin</p>
          <h1 className="font-heading text-2xl font-bold text-graphite italic">Enter Password</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            placeholder="Password"
            className="w-full bg-transparent border-b border-graphite/15 focus:border-cobalt outline-none py-2 font-body text-sm text-graphite"
          />
          <button
            onClick={login}
            className="font-mono text-xs uppercase tracking-widest bg-cobalt text-alabaster px-6 py-3 rounded hover:opacity-90 transition-opacity"
          >
            Enter
          </button>
          {authError && <p className="font-mono text-xs text-red-500">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-alabaster">
      <div className="px-6 md:px-16 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-graphite/50 hover:text-graphite transition-colors focus:outline-none focus:ring-2 focus:ring-cobalt focus:ring-offset-4 rounded"
        >
          <ArrowLeft className="w-3 h-3" /> Home
        </Link>
        <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-graphite/30">
          Genome Lens
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-16 pt-8 pb-20 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease }}
          className="mb-16 space-y-6"
        >
          <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-cobalt">Admin</p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-graphite italic">
            Generate Podcast
          </h1>
        </motion.div>

        <div className="space-y-8">
          <Field label="Upload Paper PDF">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              className="w-full font-body text-sm text-graphite"
            />
          </Field>

          <Field label="Publication URL">
            <input
              className="w-full bg-transparent border-b border-graphite/15 focus:border-cobalt outline-none py-2 font-body text-sm text-graphite"
              value={form.publication_url}
              onChange={handleChange("publication_url")}
            />
          </Field>

          <Field label="Tool URL">
            <input
              className="w-full bg-transparent border-b border-graphite/15 focus:border-cobalt outline-none py-2 font-body text-sm text-graphite"
              value={form.tool_url}
              onChange={handleChange("tool_url")}
            />
          </Field>

          <Field label="Image URL">
            <input
              className="w-full bg-transparent border-b border-graphite/15 focus:border-cobalt outline-none py-2 font-body text-sm text-graphite"
              value={form.image_url}
              onChange={handleChange("image_url")}
            />
          </Field>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-mono text-xs uppercase tracking-widest bg-cobalt text-alabaster px-6 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Queuing…" : "Generate Podcast"}
          </button>

          {message && (
            <p
              className={`font-mono text-xs ${
                status === "error" ? "text-red-500" : "text-cobalt"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-16 pt-8 pb-20 space-y-8">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.4em] uppercase text-cobalt">
            Unpublished Podcasts ({pendingEpisodes.length})
          </p>

          <button
            onClick={fetchPending}
            className="font-mono text-xs uppercase tracking-widest text-graphite/50 hover:text-cobalt transition-colors"
          >
            Refresh
          </button>
        </div>

        {pendingEpisodes.length === 0 ? (
          <p className="font-mono text-xs text-graphite/40">
            No unpublished podcasts found.
          </p>
        ) : (
        pendingEpisodes.map((ep) => (
          <PendingEpisodeCard
            key={ep.id}
            episode={ep}
            onPublished={fetchPending}
          />
        ))
      )}
    </div>

    <Footer />
  </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] tracking-widest uppercase text-graphite/40">{label}</p>
      {children}
    </div>
  );
}

function PendingEpisodeCard({ episode, onPublished }) {
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description);
  const [tags, setTags] = useState(episode.tags.join(", "));
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
  setPublishing(true);
  setError("");

  try {
    const res = await fetch("/api/podcasts/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        id: episode.id,
        title,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to publish");
    }

    await onPublished();

  } catch (e) {
    console.error("Publish failed:", e);
    setError(e.message || "Failed to publish");
  } finally {
    setPublishing(false);
  }
}

  return (
    <div className="border border-graphite/15 rounded p-4 space-y-4">
      <Field label="Title">
        <input
          className="w-full bg-transparent border-b border-graphite/15 focus:border-cobalt outline-none py-2 font-body text-sm text-graphite"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="Description">
        <textarea
          rows={3}
          className="w-full bg-transparent border border-graphite/15 focus:border-cobalt outline-none p-3 font-body text-sm text-graphite rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <Field label="Tags (comma separated)">
        <input
          className="w-full bg-transparent border-b border-graphite/15 focus:border-cobalt outline-none py-2 font-body text-sm text-graphite"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </Field>
      <button
        onClick={handlePublish}
        disabled={publishing}
        className="font-mono text-xs uppercase tracking-widest bg-cobalt text-alabaster px-6 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {publishing ? "Publishing…" : "Publish"}
      </button>
      {error && <p className="font-mono text-xs text-red-500">{error}</p>}
    </div>
  );
}