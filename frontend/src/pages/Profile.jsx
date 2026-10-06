import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, Calendar, Mail, Heart, Film, Tv, Gamepad2, MapPin, Utensils, 
  MessageCircle, ArrowLeft, Edit3, Save, X, Trash2, Image as ImageIcon, Phone,
  ShieldAlert
} from 'lucide-react';
import { SpiderHangingLoader, SpiderOverlayLoader } from '../components/SpiderMascot';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PreferenceSelect from '../components/PreferenceSelect';
import { MOVIE_GENRES, PLACE_TYPES, SERIES_GENRES, GAME_TYPES } from '../constants/preferences';
import {
  useProfileQuery,
  useProfileContributionsQuery,
  useUpdateProfileMutation,
  useDeletePostMutation,
  useUpdatePostMutation,
  useUpdateProfilePictureMutation
} from '../api/queries';

const resolveImageUrl = (img) => {
  if (!img) return '';
  const firstImg = img.split(',')[0];
  if (firstImg.startsWith('http://') || firstImg.startsWith('https://')) {
    return firstImg;
  }
  return `/api/v1/uploads/${firstImg}`;
};

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const profileId = id || currentUser?.id;
  const isOwnProfile = String(profileId) === String(currentUser?.id);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('posts');

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

  // Social stats & states (TanStack Query)
  const { data: profileUser, isLoading: userLoading } = useProfileQuery(profileId, isOwnProfile);
  const { data: contributions = {}, isLoading: contributionsLoading } = useProfileContributionsQuery(profileId);

  const {
    movies = [],
    webseries: webSeries = [],
    games = [],
    places = [],
    restaurants = [],
    posts = []
  } = contributions;

  const updateProfileMutation = useUpdateProfileMutation();
  const updateProfilePictureMutation = useUpdateProfilePictureMutation();
  const deletePostMutation = useDeletePostMutation();
  const updatePostMutation = useUpdatePostMutation();

  const loading = userLoading || contributionsLoading;
  const apiLoading = updateProfileMutation.isPending || 
                     updateProfilePictureMutation.isPending ||
                     deletePostMutation.isPending || 
                     updatePostMutation.isPending;
  const apiMessage = updateProfileMutation.isPending ? 'Updating profile...' :
                     updateProfilePictureMutation.isPending ? 'Uploading picture...' :
                     deletePostMutation.isPending ? 'Deleting post...' :
                     updatePostMutation.isPending ? 'Updating post...' : '';

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

  // Synchronize editForm when profileUser loads or updates
  useEffect(() => {
    if (profileUser) {
      setEditForm(profileUser);
    }
  }, [profileUser]);

  // Profile update
  const handleSaveProfile = async () => {
    updateProfileMutation.mutate({
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      mobileNumber: editForm.mobileNumber,
      favMovieGenre: editForm.favMovieGenre,
      favPlaceType: editForm.favPlaceType,
      favSeriesGenre: editForm.favSeriesGenre,
      favGameType: editForm.favGameType
    }, {
      onSuccess: () => {
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      },
      onError: (e) => {
        showToast(e.response?.data || 'Failed to update profile.', 'error');
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

  // Profile Picture Upload
  const handleProfilePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateProfilePictureMutation.mutate(file, {
        onSuccess: () => {
          showToast('Profile picture updated successfully!', 'success');
        },
        onError: () => {
          showToast('Failed to update profile picture.', 'error');
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[55vh]">
        <SpiderHangingLoader message="Loading profile..." size={56} />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="glass p-8 rounded-3xl text-center text-slate-500">
        <p>User profile not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          Go Back
        </button>
      </div>
    );
  }

  const tabItems = [
    { id: 'posts', label: 'Posts', count: posts.length, icon: <ImageIcon className="h-4 w-4" /> },
    { id: 'movies', label: 'Movies', count: movies.length, icon: <Film className="h-4 w-4" />, data: movies },
    { id: 'webseries', label: 'Web Series', count: webSeries.length, icon: <Tv className="h-4 w-4" />, data: webSeries },
    { id: 'games', label: 'Games', count: games.length, icon: <Gamepad2 className="h-4 w-4" />, data: games },
    { id: 'places', label: 'Places', count: places.length, icon: <MapPin className="h-4 w-4" />, data: places },
    { id: 'restaurants', label: 'Restaurants', count: restaurants.length, icon: <Utensils className="h-4 w-4" />, data: restaurants }
  ];

  const activeTabData = tabItems.find(t => t.id === activeTab)?.data || [];

  const renderPreferenceChips = (name) => {
    let options = [];
    if (name === 'favMovieGenre') options = MOVIE_GENRES;
    else if (name === 'favPlaceType') options = PLACE_TYPES;
    else if (name === 'favSeriesGenre') options = SERIES_GENRES;
    else if (name === 'favGameType') options = GAME_TYPES;

    const currentValue = editForm[name] || '';

    return (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {options.map((opt) => {
          const isSelected = currentValue === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setEditForm({ ...editForm, [name]: opt })}
              className={`px-2.5 py-1 text-[10px] rounded-full border font-semibold transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-purple-500/25 border-purple-500 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.35)] scale-[1.03]'
                  : 'bg-slate-950/60 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  };

  const editField = (label, name, icon) => (
    <div className={`p-3 rounded-xl bg-slate-950 border border-slate-900 space-y-1.5 transition-all duration-300 ${
      isEditing && ['favMovieGenre', 'favPlaceType', 'favSeriesGenre', 'favGameType'].includes(name) ? 'col-span-2' : ''
    }`}>
      <label className="text-[9px] text-slate-500 uppercase tracking-wider flex items-center gap-1">{icon}{label}</label>
      {isEditing && name !== 'email' ? (
        ['favMovieGenre', 'favPlaceType', 'favSeriesGenre', 'favGameType'].includes(name) ? (
          renderPreferenceChips(name)
        ) : (
          <input
            type="text"
            value={editForm[name] || ''}
            onChange={(e) => setEditForm({ ...editForm, [name]: e.target.value })}
            className="w-full bg-transparent border-b border-slate-800 focus:border-purple-500 outline-none text-xs font-semibold text-slate-300 pb-1 transition"
          />
        )
      ) : (
        <span className="text-xs font-semibold text-slate-300 block">{profileUser[name] || 'N/A'}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Spider Overlay for API calls */}
      <SpiderOverlayLoader visible={apiLoading} message={apiMessage} />

      {/* Back button */}
      {!isOwnProfile && (
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}

      {/* Profile Header */}
      <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
        <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-xl flex-shrink-0 relative group">
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-3xl font-bold text-slate-100 overflow-hidden relative">
            {profileUser.profilePicture ? (
              <img src={resolveImageUrl(profileUser.profilePicture)} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profileUser.firstName?.charAt(0)
            )}
            
            {isOwnProfile && isEditing && (
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="h-6 w-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleProfilePictureUpload} />
              </label>
            )}
          </div>
        </div>

        <div className="flex-grow text-center md:text-left space-y-4 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start gap-3">
            <div>
              {isEditing ? (
                <div className="flex gap-2 flex-wrap">
                  <input
                    value={editForm.firstName || ''}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="text-2xl font-extrabold bg-transparent border-b-2 border-purple-500 outline-none text-slate-100 w-36"
                    placeholder="First Name"
                  />
                  <input
                    value={editForm.lastName || ''}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="text-2xl font-extrabold bg-transparent border-b-2 border-purple-500 outline-none text-slate-100 w-36"
                    placeholder="Last Name"
                  />
                </div>
              ) : (
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-xs text-slate-400 font-medium">
                {!isEditing && isOwnProfile && profileUser.email && (
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4 text-slate-500" /> {profileUser.email}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-500" /> Member since 2026</span>
                {!isEditing && isOwnProfile && profileUser.mobileNumber && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-slate-500" /> {profileUser.mobileNumber}</span>
                )}
              </div>
            </div>

            {/* Edit / Save buttons */}
            {isOwnProfile && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-xs font-bold shadow-md hover:opacity-90 transition active:scale-95"
                    >
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setEditForm(profileUser); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="border-t border-slate-900/60 pt-4">
            <h3 className="text-[10px] font-bold tracking-wider text-purple-300 uppercase mb-3 flex items-center gap-1.5 justify-center md:justify-start">
              <Heart className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
              Interests & Preferences
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {editField('Movie Genre', 'favMovieGenre', <Film className="h-3 w-3" />)}
              {editField('Place Type', 'favPlaceType', <MapPin className="h-3 w-3" />)}
              {editField('Series Genre', 'favSeriesGenre', <Tv className="h-3 w-3" />)}
              {editField('Game Type', 'favGameType', <Gamepad2 className="h-3 w-3" />)}
            </div>
            {isEditing && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {editField('Mobile Number', 'mobileNumber', <Phone className="h-3 w-3" />)}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-900/50 space-y-1 opacity-50">
                  <label className="text-[9px] text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3 w-3" />Email (cannot be changed)
                  </label>
                  <span className="text-xs font-semibold text-slate-500 block">{profileUser.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contributions & Posts */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-purple-400" />
            Activity & Contributions
          </h2>
          <p className="text-xs text-slate-400">Browse posts and listings created by this member.</p>
        </div>

        {/* Tab triggers */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar border-b border-slate-900">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-purple-500/10 border-purple-500/35 text-purple-300 shadow'
                  : 'bg-transparent border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 text-slate-500 font-bold">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center text-slate-500 text-xs">
              No posts by this member yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map(post => (
                <article key={post.id} className="glass bg-slate-900/70 border-white/15 rounded-3xl p-5 space-y-3 group hover:border-slate-700 transition-all">
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {isOwnProfile && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
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

                  {/* Caption */}
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
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    post.caption && (
                      <p className="text-sm text-slate-300 leading-relaxed font-light whitespace-pre-wrap">{post.caption}</p>
                    )
                  )}

                  {/* Image */}
                  {post.imageUrl && editingPostId !== post.id && (
                    <div className="w-full rounded-2xl overflow-hidden border border-slate-900 bg-slate-950/30 flex items-center justify-center p-1 min-h-[200px] max-h-[480px]">
                      <img 
                        src={resolveImageUrl(post.imageUrl)} 
                        alt="Moment Photo" 
                        className="max-w-full max-h-[450px] object-contain w-auto h-auto transition-transform duration-500 hover:scale-[1.01]" 
                        onError={(e) => { e.target.src = "https://picsum.photos/seed/fallback/600/600"; }}
                      />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-[10px] text-slate-500 pt-2 border-t border-slate-900/40">
                    <span className="flex items-center gap-1">
                      <Heart className={`h-3.5 w-3.5 ${post.likedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''}`} />
                      {post.likesCount} Likes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {post.comments?.length || 0} Comments
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {/* Discovery tabs */}
        {activeTab !== 'posts' && (
          activeTabData.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center text-slate-500 text-xs">
              No {activeTab} contributed by this member yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {activeTabData.map(item => {
                const fileKey = item.posterUrl || item.coverUrl || item.photoUrl || item.menuImageUrl;
                return (
                  <div 
                    key={item.id}
                    onClick={() => navigate(`/discover?module=${activeTab}`)}
                    className="glass p-4 rounded-2xl flex gap-4 hover:border-slate-700 hover:bg-slate-900/30 transition cursor-pointer"
                  >
                    <div className="h-16 w-16 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-slate-900">
                      {fileKey ? (
                        <img src={resolveImageUrl(fileKey)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Sparkles className="h-5 w-5" /></div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <h4 className="font-bold text-xs text-slate-200 truncate">{item.name}</h4>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {item.genre || item.platform || item.location}
                        </span>
                      </div>
                      <span className="text-[10px] text-purple-400 flex items-center gap-1 font-semibold">
                        View in catalog →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
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
    </div>
  );
};

export default Profile;
