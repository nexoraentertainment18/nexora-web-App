import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Image as ImageIcon, Heart, MessageCircle, Send, UserPlus, Check, X, Search, Sparkles, Frown, Trash2, Edit3, ShieldAlert 
} from 'lucide-react';
import { SpiderHangingLoader, SpiderOverlayLoader } from '../components/SpiderMascot';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { ButtonLoader } from '../components/NexoraLoader';
import {
  useFeedQuery,
  useActiveFriendsQuery,
  usePendingRequestsQuery,
  useCreatePostMutation,
  useDeletePostMutation,
  useLikePostMutation,
  useCommentPostMutation,
  useAcceptFriendMutation,
  useDeclineFriendMutation,
  useSendFriendRequestMutation,
  useUpdatePostMutation,
  useEditCommentMutation,
  useDeleteCommentMutation
} from '../api/queries';

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return `/api/v1/uploads/${img}`;
};

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Social stats & states (TanStack Query)
  const { data: feed = [], isLoading: feedLoading } = useFeedQuery();
  const { data: friends = [], isLoading: friendsLoading } = useActiveFriendsQuery();
  const { data: pendingRequests = [], isLoading: pendingLoading } = usePendingRequestsQuery();

  const createPostMutation = useCreatePostMutation();
  const deletePostMutation = useDeletePostMutation();
  const updatePostMutation = useUpdatePostMutation();
  const likePostMutation = useLikePostMutation();
  const commentPostMutation = useCommentPostMutation();
  const acceptFriendMutation = useAcceptFriendMutation();
  const declineFriendMutation = useDeclineFriendMutation();
  const sendFriendRequestMutation = useSendFriendRequestMutation();
  const editCommentMutation = useEditCommentMutation();
  const deleteCommentMutation = useDeleteCommentMutation();

  // Comments states
  const [expandedComments, setExpandedComments] = useState({});
  const [editingComment, setEditingComment] = useState(null); // { postId, commentId }
  const [editCommentText, setEditCommentText] = useState('');

  const handleStartEditComment = (postId, commentId, text) => {
    setEditingComment({ postId, commentId });
    setEditCommentText(text);
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleSaveEditComment = (postId, commentId) => {
    if (!editCommentText || !editCommentText.trim()) return;
    editCommentMutation.mutate({ postId, commentId, text: editCommentText }, {
      onSuccess: () => {
        handleCancelEditComment();
      },
      onError: () => {
        showToast('Failed to update comment.', 'error');
      }
    });
  };

  const handleDeleteComment = (postId, commentId) => {
    deleteCommentMutation.mutate({ postId, commentId }, {
      onSuccess: () => {
        showToast('Comment deleted!', 'success');
      },
      onError: () => {
        showToast('Failed to delete comment.', 'error');
      }
    });
  };

  // Edit post state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editCaptionText, setEditCaptionText] = useState('');
  const [editDeleteImage, setEditDeleteImage] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, postId: null });

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditCaptionText('');
    setEditDeleteImage(false);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  // Search & Find Friends
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStateMsg, setSearchStateMsg] = useState('');

  // Composer State
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Comments entry map (postId -> text)
  const [commentInput, setCommentInput] = useState({});
  const [likesBurst, setLikesBurst] = useState([]);

  const loading = feedLoading || friendsLoading || pendingLoading;
  const apiLoading = createPostMutation.isPending || 
                     deletePostMutation.isPending || 
                     updatePostMutation.isPending ||
                     acceptFriendMutation.isPending || 
                     declineFriendMutation.isPending || 
                     sendFriendRequestMutation.isPending;
  const apiMessage = createPostMutation.isPending ? 'Posting your moment...' :
                     deletePostMutation.isPending ? 'Deleting post...' :
                     updatePostMutation.isPending ? 'Updating post...' :
                     acceptFriendMutation.isPending ? 'Accepting request...' :
                     declineFriendMutation.isPending ? 'Declining request...' :
                     sendFriendRequestMutation.isPending ? 'Sending request...' : '';

  const handleUpdatePost = (postId) => {
    const formData = new FormData();
    formData.append('caption', editCaptionText);
    formData.append('deleteImage', editDeleteImage ? 'true' : 'false');
    if (editImageFile) {
      formData.append('image', editImageFile);
    }

    updatePostMutation.mutate({ postId, formData }, {
      onSuccess: () => {
        cancelEditing();
        showToast('Post updated successfully!', 'success');
      },
      onError: () => {
        showToast('Failed to update post.', 'error');
      }
    });
  };

  // Handle image select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Submit Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!caption && !selectedFile) return;

    const formData = new FormData();
    formData.append('caption', caption);
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    createPostMutation.mutate(formData, {
      onSuccess: () => {
        setCaption('');
        setSelectedFile(null);
        setFilePreview(null);
        showToast("Moment posted successfully!", "success");
      },
      onError: () => {
        showToast("Failed to submit post.", "error");
      }
    });
  };

  // Delete post Click Trigger
  const handleDeletePostClick = (postId) => {
    setDeleteConfirm({ isOpen: true, postId });
  };

  // Perform actual deletion
  const handleConfirmDeletePost = () => {
    if (!deleteConfirm.postId) return;
    deletePostMutation.mutate(deleteConfirm.postId, {
      onSuccess: () => {
        showToast('Post deleted successfully!', 'success');
        setDeleteConfirm({ isOpen: false, postId: null });
      },
      onError: () => {
        showToast('Failed to delete post.', 'error');
        setDeleteConfirm({ isOpen: false, postId: null });
      }
    });
  };

  // Like Toggle
  const handleLikePost = async (postId, e) => {
    if (e && e.clientX && e.clientY) {
      const newParticles = Array.from({ length: 4 }).map((_, i) => ({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x: e.clientX,
        y: e.clientY,
        angle: (Math.random() * 60 - 30) * (Math.PI / 180), // random angle between -30deg and +30deg
        delay: i * 80
      }));
      setLikesBurst(prev => [...prev, ...newParticles]);
      
      // Clean up after animation finishes (1s)
      setTimeout(() => {
        setLikesBurst(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1000);
    }
    likePostMutation.mutate(postId);
  };

  // Add Comment
  const handleAddComment = async (postId) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    commentPostMutation.mutate({ postId, text }, {
      onSuccess: () => {
        setCommentInput({ ...commentInput, [postId]: '' });
        // showToast("Comment posted!", "success");
      },
      onError: () => {
        showToast("Failed to post comment.", "error");
      }
    });
  };

  // Search profiles
  const handleSearchFriends = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchStateMsg('Searching...');
    try {
      const res = await axios.get(`/api/v1/friendships/search?query=${searchQuery}`);
      setSearchResults(res.data);
      if (res.data.length === 0) {
        setSearchStateMsg('No users found.');
      } else {
        setSearchStateMsg('');
      }
    } catch (e) {
      setSearchStateMsg('Search failed.');
    }
  };

  // Send request
  const handleSendRequest = async (receiverId) => {
    sendFriendRequestMutation.mutate(receiverId, {
      onSuccess: () => {
        showToast("Friend request sent successfully!", "success");
      },
      onError: (error) => {
        showToast(error.response?.data || "Failed to send request.", "error");
      }
    });
  };

  // Accept request
  const handleAcceptRequest = async (requesterId) => {
    acceptFriendMutation.mutate(requesterId, {
      onSuccess: () => {
        showToast("Friend request accepted!", "success");
      },
      onError: () => {
        showToast("Failed to accept friend request.", "error");
      }
    });
  };

  // Decline request
  const handleDeclineRequest = async (requesterId) => {
    declineFriendMutation.mutate(requesterId, {
      onSuccess: () => {
        showToast("Friend request declined.", "info");
      },
      onError: () => {
        showToast("Failed to decline friend request.", "error");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[55vh]">
        <SpiderHangingLoader message="Loading feed..." size={56} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Spider Overlay Loader */}
      <SpiderOverlayLoader visible={apiLoading} message={apiMessage} />
      
      {/* LEFT COLUMN: SOCIAL POSTS (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Post Composer */}
        <div className="glass bg-slate-900/70 border-white/15 p-5 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></div>
            <h2 className="text-base font-bold tracking-tight text-slate-200">Share a Moment</h2>
          </div>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <textarea
              placeholder="What's on your mind?..."
              rows="3"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-900 focus:border-purple-500/50 focus:outline-none text-sm leading-relaxed resize-none transition"
            />
            
            {filePreview && (
              <div className="relative rounded-2xl overflow-hidden max-h-60 border border-slate-800">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 cursor-pointer text-slate-300 transition">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                Attach Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <button
                type="submit"
                disabled={createPostMutation.isPending || (!caption && !selectedFile)}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-xs font-bold shadow-md shadow-purple-500/10 hover:shadow-purple-500/30 transition transform active:scale-95 disabled:opacity-40 disabled:scale-100"
              >
                {createPostMutation.isPending ? <ButtonLoader text="Posting" /> : 'Post Moment'}
              </button>
            </div>
          </form>
        </div>

        {/* Gated Feed Timeline */}
        {feed.length === 0 ? (
          <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-center text-slate-500">
            <Frown className="h-16 w-16 text-slate-700 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-400 mb-2">Private Social Feed</h3>
            <p className="text-xs max-w-sm leading-relaxed">
              No moments yet. Make sure to find friends and connect! Once they accept your request, their updates will stream here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {feed.map((post) => (
              <article key={post.id} className="glass bg-slate-900/70 border-white/15 rounded-3xl p-6 space-y-4 shadow-xl">
                {/* Author Info */}
                <div className="flex justify-between items-center">
                  <div 
                    onClick={() => navigate(`/profile/${post.user.id}`)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-purple-300 group-hover:border-purple-500 transition">
                      {post.user.firstName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-200 group-hover:text-purple-300 block transition">
                        {post.user.firstName} {post.user.lastName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {post.user.id === user?.id && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                        Author
                      </span>
                      <button
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditCaptionText(post.caption || '');
                          setEditDeleteImage(false);
                          setEditImageFile(null);
                          setEditImagePreview(null);
                        }}
                        className="p-1.5 rounded-full bg-slate-950/80 hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 border border-white/5 transition-all"
                        title="Edit Caption"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePostClick(post.id)}
                        className="p-1.5 rounded-full bg-slate-950/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 transition-all"
                        title="Delete Post"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Caption Inline Editor or Display */}
                {editingPostId === post.id ? (
                  <div className="space-y-3 p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                    <textarea
                      value={editCaptionText}
                      onChange={(e) => setEditCaptionText(e.target.value)}
                      className="w-full min-h-[80px] p-3 text-sm text-slate-200 bg-slate-900/60 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 resize-y no-scrollbar"
                      placeholder="Update your caption..."
                    />

                    {/* Image Preview & Actions in Edit Mode */}
                    {post.imageUrl && !editDeleteImage && !editImagePreview && (
                      <div className="relative rounded-xl overflow-hidden max-h-40 border border-slate-800 bg-slate-950/30 flex items-center justify-center p-1">
                        <img 
                          src={resolveImageUrl(post.imageUrl)} 
                          alt="Current Post" 
                          className="max-h-36 object-contain rounded" 
                        />
                        <button
                          type="button"
                          onClick={() => setEditDeleteImage(true)}
                          className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold rounded-full bg-red-650 text-white hover:bg-red-700 transition"
                        >
                          Remove Photo
                        </button>
                      </div>
                    )}

                    {editDeleteImage && (
                      <div className="p-3 text-center rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400">
                        Current photo will be deleted upon saving.
                        <button
                          type="button"
                          onClick={() => setEditDeleteImage(false)}
                          className="ml-2 underline text-slate-300 hover:text-slate-100 font-semibold"
                        >
                          Keep Photo
                        </button>
                      </div>
                    )}

                    {editImagePreview && (
                      <div className="relative rounded-xl overflow-hidden max-h-40 border border-slate-800 bg-slate-950/30 flex items-center justify-center p-1">
                        <img 
                          src={editImagePreview} 
                          alt="New Upload" 
                          className="max-h-36 object-contain rounded" 
                        />
                        <button
                          type="button"
                          onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                          className="absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                        >
                          Cancel New Photo
                        </button>
                      </div>
                    )}

                    {/* File selector for edit mode */}
                    <div className="flex justify-between items-center gap-2 pt-1">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-full border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 cursor-pointer text-slate-300 transition">
                        <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                        Replace Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEditImageFile(file);
                              setEditImagePreview(URL.createObjectURL(file));
                              setEditDeleteImage(false);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      <div className="flex gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdatePost(post.id)}
                          disabled={updatePostMutation.isPending}
                          className="px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {updatePostMutation.isPending ? <ButtonLoader text="Saving" /> : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  post.caption && (
                    <p className="text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap">
                      {post.caption}
                    </p>
                  )
                )}

                {/* Image Section - Fully centered and adjusted for all screen sizes */}
                {post.imageUrl && editingPostId !== post.id && (
                  <div className="w-full rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/30 flex items-center justify-center p-1 min-h-[200px] max-h-[480px]">
                    <img 
                      src={resolveImageUrl(post.imageUrl)} 
                      alt="Moment Photo" 
                      className="max-w-full max-h-[450px] object-contain w-auto h-auto transition-transform duration-500 hover:scale-[1.01]" 
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600"; }}
                    />
                  </div>
                )}

                {/* Engagement Actions */}
                <div className="flex gap-6 border-t border-b border-slate-900/60 py-3 text-slate-400 text-xs">
                  <button 
                    onClick={(e) => handleLikePost(post.id, e)}
                    className={`flex items-center gap-2 transition hover:text-rose-400 ${
                      post.likedByCurrentUser ? 'text-rose-500 font-bold' : ''
                    }`}
                  >
                    <Heart className={`h-4.5 w-4.5 ${post.likedByCurrentUser ? 'fill-rose-500' : ''}`} />
                    <span>{post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4.5 w-4.5 text-slate-500" />
                    <span>{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</span>
                  </div>
                </div>

                {/* Comments Box */}
                <div className="space-y-4 pt-2">
                  {post.comments.length > 2 && (
                    <button
                      onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className="text-xs font-semibold text-slate-500 hover:text-purple-400 transition-colors duration-150 pl-1 block cursor-pointer"
                    >
                      {expandedComments[post.id] ? 'Hide comments' : `View all ${post.comments.length} comments`}
                    </button>
                  )}

                  {post.comments.length > 0 && (
                    <div className="space-y-3.5 pl-2 border-l border-slate-900 max-h-56 overflow-y-auto no-scrollbar">
                      {(expandedComments[post.id] ? post.comments : post.comments.slice(-2)).map((comment, index) => {
                        const isCommentOwner = comment.userId === user?.id;
                        const isPostOwner = post.user.id === user?.id;
                        const canDelete = isCommentOwner || isPostOwner;
                        const canEdit = isCommentOwner;
                        const isEditingThisComment = editingComment?.postId === post.id && editingComment?.commentId === comment.id;

                        return (
                          <div key={comment.id || index} className="text-xs group flex items-start justify-between gap-3 py-0.5">
                            <div className="flex-grow min-w-0">
                              {isEditingThisComment ? (
                                <div className="space-y-2 py-1">
                                  <input
                                    type="text"
                                    value={editCommentText}
                                    onChange={(e) => setEditCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEditComment(post.id, comment.id)}
                                    className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-purple-500/50 text-slate-200 transition"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={handleCancelEditComment}
                                      className="px-2 py-1 text-[10px] rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold transition"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEditComment(post.id, comment.id)}
                                      disabled={editCommentMutation.isPending}
                                      className="px-2 py-1 text-[10px] rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/10 transition"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="leading-relaxed">
                                  <span 
                                    onClick={() => navigate(`/profile/${comment.userId}`)}
                                    className="font-bold text-slate-200 hover:text-purple-400 cursor-pointer mr-2 transition-colors duration-150"
                                  >
                                    {comment.userName}
                                  </span>
                                  <span className="text-slate-300 font-light break-words">{comment.text}</span>
                                  
                                  <div className="flex items-center gap-2.5 mt-1 text-[10px] text-slate-500 font-medium">
                                    <span>
                                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                                        hour: '2-digit', minute: '2-digit'
                                      }) : 'Just now'}
                                    </span>
                                    {canEdit && (
                                      <>
                                        <span className="text-slate-700">•</span>
                                        <button 
                                          onClick={() => handleStartEditComment(post.id, comment.id, comment.text)}
                                          className="hover:text-purple-400 transition-colors"
                                        >
                                          Edit
                                        </button>
                                      </>
                                    )}
                                    {canDelete && (
                                      <>
                                        <span className="text-slate-700">•</span>
                                        <button 
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          className="hover:text-red-400 transition-colors"
                                        >
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentInput[post.id] || ''}
                      onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      className="flex-grow px-4 py-2.5 rounded-full bg-slate-950/60 border border-slate-900 text-xs focus:outline-none focus:border-purple-500/50 transition text-slate-300"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={commentPostMutation.isPending}
                      className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/35 transition active:scale-95 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: FRIENDS MANAGER (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Friend Finder Search */}
        <div className="glass p-5 rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4.5 w-4.5 text-purple-400" />
            <h2 className="text-sm font-bold text-slate-200">Find Connections</h2>
          </div>
          <form onSubmit={handleSearchFriends} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by first/last name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-900 text-xs focus:outline-none focus:border-purple-500/50 transition text-slate-300"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-xs font-semibold shadow-md active:scale-95 transition"
            >
              Search
            </button>
          </form>

          {/* Search Results */}
          {searchStateMsg && (
            <p className="text-[11px] text-slate-500 italic text-center">{searchStateMsg}</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
              {searchResults.map((resUser) => (
                <div key={resUser.id} className="p-3 rounded-xl bg-slate-950/40 border border-slate-900 flex justify-between items-center">
                  <div>
                    <span 
                      onClick={() => navigate(`/profile/${resUser.id}`)}
                      className="font-bold text-xs text-slate-300 hover:text-purple-400 cursor-pointer block"
                    >
                      {resUser.firstName} {resUser.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500">{resUser.email}</span>
                  </div>
                  <button
                    onClick={() => handleSendRequest(resUser.id)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-purple-500/10 border border-slate-800 hover:border-purple-500/30 text-purple-400 transition"
                    title="Send Friend Request"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="glass p-5 rounded-3xl space-y-4 border border-purple-500/20 bg-purple-500/3 animate-pulse-slow">
            <h3 className="text-xs font-bold tracking-wider text-purple-300 uppercase flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-purple-400" />
              Incoming Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-3 rounded-xl bg-slate-950 border border-slate-900 flex justify-between items-center">
                  <div>
                    <span 
                      onClick={() => navigate(`/profile/${req.id}`)}
                      className="font-semibold text-xs text-slate-300 hover:text-purple-400 cursor-pointer block"
                    >
                      {req.firstName} {req.lastName}
                    </span>
                    <span className="text-[9px] text-slate-500">{req.email}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 transition"
                      title="Accept Request"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 transition"
                      title="Decline Request"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends Tray */}
        <div className="glass p-5 rounded-3xl space-y-4">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            Mutual Friends ({friends.length})
          </h3>
          {friends.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">No friends added yet. Use the finder above to expand your network!</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
              {friends.map((friend) => (
                <div 
                  key={friend.id}
                  onClick={() => navigate(`/profile/${friend.id}`)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/60 border border-transparent hover:border-slate-800 transition cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                    {friend.firstName.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-300 block">{friend.firstName} {friend.lastName}</span>
                    <span className="text-[9px] text-slate-500">{friend.email}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Post?"
        description="Are you sure you want to permanently delete this post?"
        alertTitle="Critical Action Alert"
        alertMessage="Deleting this post will permanently erase the captions, comments, and media from the shared database. This action is irreversible."
        onCancel={() => setDeleteConfirm({ isOpen: false, postId: null })}
        onConfirm={handleConfirmDeletePost}
      />

      {/* Floating Heart Particles */}
      {likesBurst.map(p => (
        <span
          key={p.id}
          className="fixed pointer-events-none text-rose-500 z-[9999] heart-burst-particle"
          style={{
            top: `${p.y}px`,
            left: `${p.x}px`,
            animationDelay: `${p.delay}ms`,
            '--x-travel': `${Math.sin(p.angle) * 80}px`,
            '--y-travel': `-${100 + Math.random() * 50}px`,
            '--rot-deg': `${Math.random() * 90 - 45}deg`
          }}
        >
          <Heart className="h-4 w-4 fill-rose-500" />
        </span>
      ))}
    </div>
  );
};

export default Feed;
