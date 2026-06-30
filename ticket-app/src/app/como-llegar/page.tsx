"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SectionHeader from "@/app/sections/section-header";

interface RideComment {
  id: string;
  postId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface RidePost {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  comments: RideComment[];
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

interface PostCardProps {
  post: RidePost;
  isReplyOpen: boolean;
  onToggleReply: () => void;
  replyAuthor: string;
  replyContent: string;
  onReplyAuthorChange: (v: string) => void;
  onReplyContentChange: (v: string) => void;
  onSubmitReply: (token: string) => void;
  submittingReply: boolean;
  replyError: string | undefined;
}

function PostCard({
  post,
  isReplyOpen,
  onToggleReply,
  replyAuthor,
  replyContent,
  onReplyAuthorChange,
  onReplyContentChange,
  onSubmitReply,
  submittingReply,
  replyError,
}: PostCardProps) {
  const [replyToken, setReplyToken] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (replyToken) onSubmitReply(replyToken);
  }

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
      <p className="text-white/75 text-sm whitespace-pre-wrap leading-relaxed mb-3">
        {post.content}
      </p>

      {post.comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {post.comments.map((c) => (
            <div
              key={c.id}
              className="bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2"
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="font-epilogue font-medium text-white/80 text-xs">
                  {c.authorName}
                </span>
                <span className="text-white/30 text-[11px] shrink-0">
                  {formatDate(c.createdAt)}
                </span>
              </div>
              <p className="text-white/65 text-xs whitespace-pre-wrap leading-relaxed">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onToggleReply}
        className="text-white/40 text-xs hover:text-white/65 transition-colors"
      >
        {isReplyOpen ? "Cancelar" : "Responder"}
      </button>

      {isReplyOpen && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Tu nombre"
            value={replyAuthor}
            onChange={(e) => onReplyAuthorChange(e.target.value)}
            className="w-full bg-white/[0.08] border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-epilogue text-xs"
          />
          <textarea
            placeholder="Tu respuesta..."
            value={replyContent}
            onChange={(e) => onReplyContentChange(e.target.value)}
            rows={2}
            className="w-full bg-white/[0.08] border border-white/15 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 font-epilogue text-xs resize-none"
          />
          {SITE_KEY && (
            <Turnstile
              siteKey={SITE_KEY}
              onSuccess={(token) => setReplyToken(token)}
              onExpire={() => setReplyToken("")}
              options={{ size: "flexible", theme: "dark" }}
            />
          )}
          {replyError && (
            <p className="text-red-400 text-xs">{replyError}</p>
          )}
          <button
            type="submit"
            disabled={
              submittingReply ||
              !replyAuthor.trim() ||
              !replyContent.trim() ||
              (!!SITE_KEY && !replyToken)
            }
            className="w-full font-epilogue font-medium text-xs text-white/80 bg-white/[0.12] border border-white/20 rounded-full py-2 hover:bg-white/[0.2] disabled:opacity-40 transition-colors"
          >
            {submittingReply ? "Enviando..." : "Enviar respuesta"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ComoLlegarPage() {
  const router = useRouter();

  const [posts, setPosts] = useState<RidePost[] | null>(null);
  const [boardLoading, setBoardLoading] = useState(true);
  const [boardError, setBoardError] = useState<string | null>(null);

  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newToken, setNewToken] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [newPostError, setNewPostError] = useState<string | null>(null);
  const newTurnstileRef = useRef<TurnstileInstance | undefined>(undefined);

  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyAuthor, setReplyAuthor] = useState<Record<string, string>>({});
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

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
      setNewToken("");
      newTurnstileRef.current?.reset();
      setPosts((prev) => [data as RidePost, ...(prev ?? [])]);
    } catch {
      setNewPostError("No se pudo conectar con el servidor");
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleReply(postId: string, token: string) {
    setSubmittingReply(postId);
    setReplyErrors((prev) => ({ ...prev, [postId]: "" }));

    try {
      const res = await fetch(`/api/ride-posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: replyAuthor[postId] ?? "",
          content: replyContent[postId] ?? "",
          turnstileToken: token,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReplyErrors((prev) => ({
          ...prev,
          [postId]: data.error ?? "Error",
        }));
        return;
      }

      setPosts((prev) =>
        prev?.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments, data as RideComment] }
            : p,
        ) ?? null,
      );
      setReplyAuthor((prev) => ({ ...prev, [postId]: "" }));
      setReplyContent((prev) => ({ ...prev, [postId]: "" }));
      setOpenReplyId(null);
    } catch {
      setReplyErrors((prev) => ({
        ...prev,
        [postId]: "No se pudo conectar",
      }));
    } finally {
      setSubmittingReply(null);
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
              [Dirección del venue, Ciudad]
            </p>
          </div>

          <div className="bg-white/[0.06] border border-white/10 rounded-xl px-5 py-4 mb-3">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">
              Cómo llegar
            </p>
            <div className="space-y-2 text-white/70 font-epilogue text-sm leading-relaxed">
              <p>🚌 [Transporte público — líneas disponibles]</p>
              <p>🚗 [Estacionamiento — indicaciones]</p>
              <p>🚕 [Remís / Uber — recomendaciones]</p>
            </div>
          </div>

          <a
            href="https://maps.google.com/?q=[DIRECCIÓN]"
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
            Publicá si tenés lugar en tu auto o buscás colgarte de alguien
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
              Todavía no hay publicaciones. ¡Sé el primero!
            </p>
          )}

          {posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isReplyOpen={openReplyId === post.id}
              onToggleReply={() =>
                setOpenReplyId((id) => (id === post.id ? null : post.id))
              }
              replyAuthor={replyAuthor[post.id] ?? ""}
              replyContent={replyContent[post.id] ?? ""}
              onReplyAuthorChange={(v) =>
                setReplyAuthor((prev) => ({ ...prev, [post.id]: v }))
              }
              onReplyContentChange={(v) =>
                setReplyContent((prev) => ({ ...prev, [post.id]: v }))
              }
              onSubmitReply={(token) => handleReply(post.id, token)}
              submittingReply={submittingReply === post.id}
              replyError={replyErrors[post.id]}
            />
          ))}
        </section>
      </main>
    </div>
  );
}
