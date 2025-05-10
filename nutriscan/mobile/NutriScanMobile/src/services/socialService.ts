import api from './api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  healthGoals?: string[];
  connections?: string[];
}

export interface CommunityPost {
  _id: string;
  user: UserProfile;
  content: string;
  image?: string;
  likes: string[];
  comments: {
    user: UserProfile;
    content: string;
    timestamp: Date;
  }[];
  timestamp: Date;
}

class SocialService {
  static async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.post('/social/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  static async uploadProfilePicture(imageFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', imageFile);

      const response = await api.post('/social/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.profilePictureUrl;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  static async findUsers(query: string): Promise<UserProfile[]> {
    try {
      const response = await api.get('/social/users', { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Find users error:', error);
      throw error;
    }
  }

  static async connectWithUser(userId: string): Promise<void> {
    try {
      await api.post('/social/connect', { userId });
    } catch (error) {
      console.error('Connect with user error:', error);
      throw error;
    }
  }

  static async createCommunityPost(postData: { content: string, image?: string }): Promise<CommunityPost> {
    try {
      const response = await api.post('/social/feed', postData);
      return response.data;
    } catch (error) {
      console.error('Create community post error:', error);
      throw error;
    }
  }

  static async getCommunityFeed(page = 1, limit = 20): Promise<{ posts: CommunityPost[], totalPages: number }> {
    try {
      const response = await api.get('/social/feed', { 
        params: { page, limit } 
      });
      return response.data;
    } catch (error) {
      console.error('Get community feed error:', error);
      throw error;
    }
  }

  static async interactWithPost(postId: string, action: 'like' | 'comment', data?: { content?: string }): Promise<CommunityPost> {
    try {
      const response = await api.post(`/social/feed/${postId}/interact`, { 
        action, 
        ...data 
      });
      return response.data;
    } catch (error) {
      console.error('Interact with post error:', error);
      throw error;
    }
  }
}

export default SocialService;
