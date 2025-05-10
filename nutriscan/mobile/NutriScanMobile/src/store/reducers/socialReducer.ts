import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserProfile, CommunityPost } from '../../services/socialService';

interface SocialState {
  profile: UserProfile | null;
  communityFeed: CommunityPost[];
  connections: UserProfile[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
}

const initialState: SocialState = {
  profile: null,
  communityFeed: [],
  connections: [],
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1
};

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    updateProfileStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    updateProfileSuccess: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    updateProfileFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    fetchCommunityFeedStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchCommunityFeedSuccess: (state, action: PayloadAction<{
      posts: CommunityPost[], 
      totalPages: number, 
      currentPage: number
    }>) => {
      state.communityFeed = action.payload.posts;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.isLoading = false;
      state.error = null;
    },
    fetchCommunityFeedFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    createPostStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    createPostSuccess: (state, action: PayloadAction<CommunityPost>) => {
      state.communityFeed.unshift(action.payload);
      state.isLoading = false;
      state.error = null;
    },
    createPostFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    findUsersStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    findUsersSuccess: (state, action: PayloadAction<UserProfile[]>) => {
      state.connections = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    findUsersFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    interactWithPostStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    interactWithPostSuccess: (state, action: PayloadAction<CommunityPost>) => {
      const index = state.communityFeed.findIndex(post => post._id === action.payload._id);
      if (index !== -1) {
        state.communityFeed[index] = action.payload;
      }
      state.isLoading = false;
      state.error = null;
    },
    interactWithPostFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    }
  }
});

export const {
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
  fetchCommunityFeedStart,
  fetchCommunityFeedSuccess,
  fetchCommunityFeedFailure,
  createPostStart,
  createPostSuccess,
  createPostFailure,
  findUsersStart,
  findUsersSuccess,
  findUsersFailure,
  interactWithPostStart,
  interactWithPostSuccess,
  interactWithPostFailure
} = socialSlice.actions;

export default socialSlice.reducer;
