import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════
// 1. FEED & SOCIAL POSTS HOOKS
// ═══════════════════════════════════════════════════════

export const useFeedQuery = () => {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/posts/feed');
      return res.data;
    }
  });
};

export const useCreatePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post('/api/v1/posts', formData);
      return res.data;
    },
    onSuccess: (newPost) => {
      // Invalidate both feed and user contributions immediately
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useDeletePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId) => {
      await axios.delete(`/api/v1/posts/${postId}`);
      return postId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useLikePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId) => {
      const res = await axios.post(`/api/v1/posts/${postId}/like`);
      return res.data;
    },
    onSuccess: (updatedPost) => {
      // Update cache instantly
      queryClient.setQueryData(['feed'], (oldFeed) => {
        if (!oldFeed) return oldFeed;
        return oldFeed.map(post => post.id === updatedPost.id ? updatedPost : post);
      });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useCommentPostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, text }) => {
      const res = await axios.post(`/api/v1/posts/${postId}/comment`, { text });
      return res.data;
    },
    onSuccess: (updatedPost) => {
      // Update cache instantly
      queryClient.setQueryData(['feed'], (oldFeed) => {
        if (!oldFeed) return oldFeed;
        return oldFeed.map(post => post.id === updatedPost.id ? updatedPost : post);
      });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useEditCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, commentId, text }) => {
      const res = await axios.put(`/api/v1/posts/${postId}/comment/${commentId}`, { text });
      return res.data;
    },
    onSuccess: (updatedPost) => {
      // Update cache instantly
      queryClient.setQueryData(['feed'], (oldFeed) => {
        if (!oldFeed) return oldFeed;
        return oldFeed.map(post => post.id === updatedPost.id ? updatedPost : post);
      });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, commentId }) => {
      const res = await axios.delete(`/api/v1/posts/${postId}/comment/${commentId}`);
      return res.data;
    },
    onSuccess: (updatedPost) => {
      // Update cache instantly
      queryClient.setQueryData(['feed'], (oldFeed) => {
        if (!oldFeed) return oldFeed;
        return oldFeed.map(post => post.id === updatedPost.id ? updatedPost : post);
      });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useUpdatePostMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, formData }) => {
      const res = await axios.put(`/api/v1/posts/${postId}`, formData);
      return res.data;
    },
    onSuccess: (updatedPost) => {
      // Invalidate feed & contributions immediately
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

// ═══════════════════════════════════════════════════════
// 2. DISCOVERY DIRECTORY LISTINGS HOOKS
// ═══════════════════════════════════════════════════════

export const useListingsQuery = (module, params) => {
  return useQuery({
    queryKey: ['listings', module, params],
    queryFn: async () => {
      let endpoint = `/api/v1/${module}`;
      const res = await axios.get(endpoint, { params });
      return res.data;
    },
    keepPreviousData: true
  });
};

export const useCreateListingMutation = (module) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      let endpoint = `/api/v1/${module}`;
      const res = await axios.post(endpoint, formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', module] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useDeleteListingMutation = (module) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId) => {
      let endpoint = `/api/v1/${module}/${itemId}`;
      await axios.delete(endpoint);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings', module] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useLikeListingMutation = (module) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId) => {
      let endpoint = `/api/v1/${module}/${itemId}/like`;
      const res = await axios.post(endpoint);
      return res.data;
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['listings', module] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

export const useCommentListingMutation = (module) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, text }) => {
      let endpoint = `/api/v1/${module}/${itemId}/comment`;
      const res = await axios.post(endpoint, { text });
      return res.data;
    },
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['listings', module] });
      queryClient.invalidateQueries({ queryKey: ['profile-contributions'] });
    }
  });
};

// ═══════════════════════════════════════════════════════
// 3. USER PROFILE HOOKS
// ═══════════════════════════════════════════════════════

export const useProfileQuery = (profileId, isOwnProfile) => {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      let endpoint = isOwnProfile ? '/api/v1/auth/me' : `/api/v1/users/${profileId}`;
      const res = await axios.get(endpoint);
      return res.data;
    },
    enabled: !!profileId
  });
};

export const useProfileContributionsQuery = (profileId) => {
  return useQuery({
    queryKey: ['profile-contributions', profileId],
    queryFn: async () => {
      const [moviesRes, seriesRes, gamesRes, placesRes, restaurantsRes, postsRes] = await Promise.all([
        axios.get(`/api/v1/movies/uploaded-by/${profileId}`),
        axios.get(`/api/v1/webseries/uploaded-by/${profileId}`),
        axios.get(`/api/v1/games/uploaded-by/${profileId}`),
        axios.get(`/api/v1/places/uploaded-by/${profileId}`),
        axios.get(`/api/v1/restaurants/uploaded-by/${profileId}`),
        axios.get(`/api/v1/posts/user/${profileId}`)
      ]);
      return {
        movies: moviesRes.data,
        webseries: seriesRes.data,
        games: gamesRes.data,
        places: placesRes.data,
        restaurants: restaurantsRes.data,
        posts: postsRes.data
      };
    },
    enabled: !!profileId
  });
};

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: async (updatedData) => {
      const res = await axios.put('/api/v1/auth/profile', updatedData);
      return res.data;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.setQueryData(['profile', updatedUser.id], updatedUser);
      // Invalidate self user profiles
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

export const useUpdateProfilePictureMutation = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: async (file) => {
      console.log('Initiating profile picture upload. File:', file);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post('/api/v1/auth/profile/picture', formData);
        console.log('Upload successful:', res.data);
        return res.data;
      } catch (error) {
        console.error('Upload failed:', error.response?.data || error.message, error);
        throw error;
      }
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.setQueryData(['profile', updatedUser.id], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// ═══════════════════════════════════════════════════════
// 4. FRIENDSHIP HOOKS
// ═══════════════════════════════════════════════════════

export const useActiveFriendsQuery = () => {
  return useQuery({
    queryKey: ['friends-active'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/friendships/active');
      return res.data;
    }
  });
};

export const usePendingRequestsQuery = () => {
  return useQuery({
    queryKey: ['friendships-pending'],
    queryFn: async () => {
      const res = await axios.get('/api/v1/friendships/pending');
      return res.data;
    }
  });
};

export const useAcceptFriendMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requesterId) => {
      await axios.post(`/api/v1/friendships/accept/${requesterId}`);
      return requesterId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends-active'] });
      queryClient.invalidateQueries({ queryKey: ['friendships-pending'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};

export const useDeclineFriendMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requesterId) => {
      await axios.post(`/api/v1/friendships/decline/${requesterId}`);
      return requesterId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships-pending'] });
    }
  });
};

export const useSendFriendRequestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (receiverId) => {
      await axios.post(`/api/v1/friendships/request/${receiverId}`);
      return receiverId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships-pending'] });
    }
  });
};

