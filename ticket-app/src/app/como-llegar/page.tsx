"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/app/sections/section-header";

interface RidePost {
  id: string;
  authorName: string;
  content: string;
  phone: string | null;
  createdAt: string;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PostCard({
  post,
  phoneRevealed,
  onRevealPhone,
}: {
  post: RidePost;
  phoneRevealed: boolean;
  onRevealPhone: () => void;
}) {
  return (
    <div className="bg-white/[0.05] border border-white/10 rounded-xl px-4 pt-4 pb-3 mb-4">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <span className="font-epilogue font-semibold text-white/90 text-sm">
          {post.authorName}
        </span>
        <span className="text-white/35 text-xs shrink-0">
          {formatDate(post.createdAt)}
        </span>
      </div>
      <p className="text-white/75 text-sm whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>
      {post.phone && (
        <div className="mt-3">
          {phoneRevealed ? (
            <a
              href={`tel:${post.phone}`}
              className="text-white/70 text-sm font-epilogue font-medium hover:text-white transition-colors"
            >
              📞 {post.phone}
            </a>
          ) : (
            <button
              type="button"
              onClick={onRevealPhone}
              className="text-white/40 text-xs hover:text-white/65 transition-colors"
            >
              Ver número
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComoLlegarPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<RidePost[] | null>(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [revealedPhones, setRevealedPhones] = useState<Set<string>>(new Set());

  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newToken, setNewToken] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [newPostError, setNewPostError] = useState<string | null>(null);
  const newTurnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/api/ride-posts");
        const data = await res.json();
        if (!res.ok) {
          setBoardError(data.error ?? "Error al cargar");
          return;
        }
        setPosts(data as RidePost[]);
        setBoardError(null);
      } catch {
        setBoardError("No se pudo conectar con el servidor");
      } finally {
        setBoardLoading(false);
      }
    }

    loadPosts();
    const interval = setInterval(loadPosts, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function handleNewPost(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPost(true);
    setNewPostError(null);

    try {
      const res = await fetch("/api/ride-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: newAuthor,
          content: newContent,
          phone: newPhone || undefined,
          turnstileToken: newToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNewPostError(data.error ?? "Ocurrió un error");
        newTurnstileRef.current?.reset();
        setNewToken("");
        return;
      }

      setNewAuthor("");
      setNewContent("");
      setNewPhone("");
      setNewToken("");
      newTurnstileRef.current?.reset();
      setPosts((prev) => [data as RidePost, ...(prev ?? [])]);
    } catch {
      setNewPostError("No se pudo conectar con el servidor");
    } finally {
      setSubmittingPost(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SectionHeader onBack={() => router.push("/")} />

      <main className="max-w-[640px] mx-auto px-5 pt-2 pb-20">
        {/* VENUE INFO */}
        <section className="mb-14">
          <h1 className="font-epilogue font-extrabold text-[clamp(32px,9vw,60px)] tracking-[-0.05em] text-white leading-none mb-1">
            Cómo llegar
          </h1>
          <p className="font-epilogue text-white/45 text-sm mb-8 tracking-[-0.02em]">
            Casa Tomada
          </p>

          <div className="bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4 mb-3">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
              Dirección
            </p>
            <p className="font-epilogue font-medium text-white/85 text-lg tracking-[-0.03em]">
              Carril Rodríguez Peña 2815, Godoy Cruz, Mendoza
            </p>
          </div>

          <div className="bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4 mb-3">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
              Transporte público
            </p>
            <div className="flex items-center gap-2 text-white/70 font-epilogue text-sm">
              <svg height="15" width="15" viewBox="0 0 24 24" fill="white" aria-label="Bus" className="shrink-0 opacity-70">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
              </svg>
              <span
                style={{ backgroundColor: "rgb(137, 123, 38)", color: "rgb(255, 255, 255)" }}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
              >
                945
              </span>
              <span
                style={{ backgroundColor: "rgb(137, 123, 38)", color: "rgb(255, 255, 255)" }}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold"
              >
                920
              </span>
            </div>
          </div>

          <a
            href="https://maps.app.goo.gl/2CWk9seZS6uiAVuMA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-white/[0.08] border border-white/15 rounded-xl py-4 font-epilogue font-medium text-white/60 hover:text-white/85 hover:bg-white/[0.12] transition-colors"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            Ver en Google Maps
          </a>
        </section>

        {/* CARPOOL BOARD */}
        <section>
          <h2 className="font-epilogue font-bold text-2xl tracking-[-0.04em] text-white mb-1">
            Viajes compartidos
          </h2>
          <p className="font-epilogue text-white/45 text-sm mb-6 tracking-[-0.02em]">
            Entra al <a className="text-white/80 hover:text-white underline" href="https://chat.whatsapp.com/B8yuh8Y99YhB5m3XjOXVtE?mode=gi_t" target="_blank" rel="noopener noreferrer">grupo</a> o publicá si tenés lugar en tu auto o si buscás con quien ir 🚗
          </p>

          {/* New post form */}
          <form
            onSubmit={handleNewPost}
            className="bg-white/[0.06] border border-white/10 rounded-xl p-4 mb-8 space-y-3"
          >
            <input
              type="text"
              placeholder="Tu nombre"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="w-full bg-white/[0.08] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-epilogue text-sm"
            />
            <textarea
              placeholder='Ej: "Salgo de San Jose a las 21:00, tengo 2 lugares"'
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="w-full bg-white/[0.08] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-epilogue text-sm resize-none"
            />
            <input
              type="text"
              placeholder="Tu número (opcional)"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              autoComplete="off"
              className="w-full bg-white/[0.08] border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-epilogue text-sm"
            />
            {SITE_KEY && (
              <Turnstile
                ref={newTurnstileRef}
                siteKey={SITE_KEY}
                onSuccess={(token) => setNewToken(token)}
                onExpire={() => setNewToken("")}
                options={{ size: "flexible", theme: "dark" }}
              />
            )}
            {newPostError && (
              <p className="text-red-400 text-xs">{newPostError}</p>
            )}
            <button
              type="submit"
              disabled={
                submittingPost ||
                !newAuthor.trim() ||
                !newContent.trim() ||
                (!!SITE_KEY && !newToken)
              }
              className="w-full font-epilogue font-medium text-sm text-white/80 bg-white/[0.14] border border-white/25 rounded-full py-2.5 hover:bg-white/[0.22] disabled:opacity-40 transition-colors"
            >
              {submittingPost ? "Publicando..." : "Publicar oferta"}
            </button>
          </form>

          {/* Posts list */}
          {boardLoading && (
            <div className="flex justify-center py-12">
              <span className="w-7 h-7 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}

          {boardError && !boardLoading && (
            <p className="text-red-400 text-sm text-center py-8">{boardError}</p>
          )}

          {!boardLoading && posts?.length === 0 && (
            <p className="text-white/35 text-sm text-center py-8">
              Todavía no hay publicaciones. Te toca romper el hielo :)
            </p>
          )}

          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              phoneRevealed={revealedPhones.has(post.id)}
              onRevealPhone={() =>
                setRevealedPhones((prev) => { const next = new Set(prev); next.add(post.id); return next; })
              }
            />
          ))}
        </section>
      </main>
    </div>
  );
}
