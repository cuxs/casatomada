"use client";

import { useEffect, useState } from "react";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminRidePostsPage() {
  const [posts, setPosts] = useState<RidePost[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ride-posts");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error al cargar");
          return;
        }
        setPosts(data as RidePost[]);
      } catch {
        setError("No se pudo conectar con el servidor");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function deletePost(id: string) {
    if (!confirm("¿Eliminar este post y todos sus comentarios?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/ride-posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev?.filter((p) => p.id !== id) ?? null);
      }
    } finally {
      setDeleting(null);
    }
  }

  async function deleteComment(postId: string, commentId: string) {
    if (!confirm("¿Eliminar este comentario?")) return;
    setDeleting(commentId);
    try {
      const res = await fetch(
        `/api/ride-posts/${postId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setPosts(
          (prev) =>
            prev?.map((p) =>
              p.id === postId
                ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
                : p,
            ) ?? null,
        );
      }
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <span className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Viajes compartidos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {posts?.length ?? 0} publicaciones
          </p>
        </div>
        <a
          href="/como-llegar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          Ver página pública →
        </a>
      </div>

      {posts?.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 text-sm">
          No hay publicaciones todavía.
        </div>
      )}

      {posts?.map((post) => (
        <div
          key={post.id}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-gray-900 text-sm">
                  {post.authorName}
                </span>
                <span className="text-gray-400 text-xs">
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </div>
            <button
              type="button"
              onClick={() => deletePost(post.id)}
              disabled={deleting === post.id}
              aria-label="Eliminar post"
              className="shrink-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>

          {post.comments.length > 0 && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="px-5 py-3 bg-gray-50/50 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="font-medium text-gray-800 text-xs">
                        {comment.authorName}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteComment(post.id, comment.id)}
                    disabled={deleting === comment.id}
                    aria-label="Eliminar comentario"
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
