import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useListingsQuery, useDeleteListingMutation } from "../api/queries";
import { useToast } from "../context/ToastContext";
import { ShieldAlert, Trash2, Send } from "lucide-react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AdminPanel = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const params = useMemo(() => ({}), []);
  const { data: movies = [], isLoading } = useListingsQuery("movies", params);
  const deleteMovieMutation = useDeleteListingMutation("movies");
  
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState({});

  const { data: feedbacks = [], isLoading: loadingFeedbacks } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const response = await axios.get('/api/v1/feedback/all');
      return response.data;
    },
    enabled: user?.role === "ADMIN"
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, text }) => {
      return axios.put(`/api/v1/feedback/${id}/reply`, { adminResponse: text });
    },
    onSuccess: () => {
      showToast("Reply sent successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
    },
    onError: () => showToast("Failed to send reply.", "error")
  });

  const handleDeleteMovie = (movieId) => {
    deleteMovieMutation.mutate(movieId, {
      onSuccess: () => {
        showToast("Movie deleted successfully.", "success");
      },
      onError: (error) => {
        showToast(error.response?.data || "Failed to delete movie.", "error");
      },
    });
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="glass p-8 rounded-3xl text-slate-100">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="w-14 h-14 text-yellow-400" />
          <h2 className="text-2xl font-bold">Admin Access Required</h2>
          <p className="text-sm text-slate-400 max-w-xl">
            Only administrators may manage the movie catalog from this page.
            Regular users can still add, like, and comment on listings in the
            community discovery modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">Admin Movie Manager</h1>
            <p className="text-sm text-slate-400 mt-2">
              Delete movie recommendations safely. This section is only visible to
              admin users.
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm text-slate-300">
            Signed in as <span className="font-semibold text-slate-100">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl">
        {isLoading ? (
          <div className="text-slate-300">Loading movies...</div>
        ) : movies.length === 0 ? (
          <div className="text-slate-400">No movies found in the catalog.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-[0.15em]">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Director</th>
                  <th className="px-4 py-3">Hero / Heroine</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id} className="border-b border-slate-800 hover:bg-slate-950/50 transition">
                    <td className="px-4 py-3 font-semibold text-slate-100">{movie.name}</td>
                    <td className="px-4 py-3">{movie.director || "Unknown"}</td>
                    <td className="px-4 py-3">{movie.hero || "N/A"} / {movie.heroine || "N/A"}</td>
                    <td className="px-4 py-3">{movie.ottPlatform || "Unknown"}</td>
                    <td className="px-4 py-3">{movie.uploadedBy?.firstName || "Unknown"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteMovie(movie.id)}
                        className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Feedback Management Section */}
      <div className="glass p-6 rounded-3xl mt-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">User Feedback</h2>
        {loadingFeedbacks ? (
          <div className="text-slate-300">Loading feedback...</div>
        ) : !Array.isArray(feedbacks) || feedbacks.length === 0 ? (
          <div className="text-slate-400">No feedback submitted yet.</div>
        ) : (
          <div className="space-y-4">
            {(Array.isArray(feedbacks) ? feedbacks : []).map((fb) => (
              <div key={fb.id} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-purple-400">{fb.username}</span>
                    <span className="text-xs text-slate-500 ml-2">{new Date(fb.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${fb.status === 'REPLIED' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {fb.status}
                  </span>
                </div>
                <p className="text-sm text-slate-200 mb-4">{fb.message}</p>
                
                {fb.status === 'REPLIED' ? (
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Your Response</span>
                    <p className="text-sm text-slate-300">{fb.adminResponse}</p>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Type a response..."
                      value={replyText[fb.id] || ''}
                      onChange={(e) => setReplyText({ ...replyText, [fb.id]: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    />
                    <button
                      onClick={() => {
                        if (replyText[fb.id]?.trim()) {
                          replyMutation.mutate({ id: fb.id, text: replyText[fb.id] });
                        }
                      }}
                      disabled={replyMutation.isPending || !replyText[fb.id]?.trim()}
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-semibold"
                    >
                      Reply <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
