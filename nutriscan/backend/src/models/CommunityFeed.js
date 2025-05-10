const mongoose = require('mongoose');

const CommunityFeedSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  contentType: {
    type: String,
    enum: [
      'Progress Update', 
      'Meal Share', 
      'Fitness Achievement', 
      'Recipe', 
      'Health Tip', 
      'Motivation'
    ],
    required: true
  },
  attachments: [{
    type: {
      type: String,
      enum: ['Image', 'Video', 'Recipe', 'Nutrition Chart']
    },
    url: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  visibility: {
    type: String,
    enum: ['Public', 'Friends', 'Private'],
    default: 'Public'
  },
  relatedHealthGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthGoal'
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
CommunityFeedSchema.index({ author: 1, createdAt: -1 });
CommunityFeedSchema.index({ tags: 1, createdAt: -1 });

// Static method to create a new feed post
CommunityFeedSchema.statics.createPost = async function(postData) {
  const post = new this({
    author: postData.authorId,
    content: postData.content,
    contentType: postData.contentType,
    attachments: postData.attachments || [],
    tags: postData.tags || [],
    visibility: postData.visibility || 'Public',
    relatedHealthGoal: postData.relatedHealthGoal
  });

  return post.save();
};

// Method to add a comment to a post
CommunityFeedSchema.methods.addComment = function(commentData) {
  this.comments.push({
    author: commentData.authorId,
    content: commentData.content
  });

  return this.save();
};

// Method to like a post
CommunityFeedSchema.methods.likePost = function(userId) {
  const existingLike = this.likes.find(like => 
    like.user.toString() === userId.toString()
  );

  if (!existingLike) {
    this.likes.push({ user: userId });
  }

  return this.save();
};

// Virtual for engagement metrics
CommunityFeedSchema.virtual('engagementScore').get(function() {
  return this.likes.length + this.comments.length * 2;
});

module.exports = mongoose.model('CommunityFeed', CommunityFeedSchema);
