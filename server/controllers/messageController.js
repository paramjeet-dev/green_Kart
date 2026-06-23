const Message = require("../models/Message");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get messages for a listing between two users
// @route   GET /api/messages/:listingId/:userId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { listingId, userId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({
      listing: listingId,
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .populate("sender", "name avatar role")
      .populate("receiver", "name avatar role")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { listing: listingId, sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { listingId, receiverId, content } = req.body;

    if (!content || !content.trim()) {
      return next(new ErrorResponse("Message content is required", 400));
    }

    const message = await Message.create({
      listing: listingId,
      sender: req.user._id,
      receiver: receiverId,
      content: content.trim(),
    });

    const populatedMessage = await message.populate([
      { path: "sender", select: "name avatar role" },
      { path: "receiver", select: "name avatar role" },
    ]);

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            listing: "$listing",
            otherUser: {
              $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
            },
          },
          lastMessage: { $first: "$content" },
          lastMessageAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$receiver", userId] }, { $eq: ["$isRead", false] }] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: "listings",
          localField: "_id.listing",
          foreignField: "_id",
          as: "listing",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.otherUser",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      {
        $unwind: { path: "$listing", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$otherUser", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          "listing._id": 1,
          "listing.foodName": 1,
          "listing.status": 1,
          "listing.images": { $slice: ["$listing.images", 1] },
          "otherUser._id": 1,
          "otherUser.name": 1,
          "otherUser.avatar": 1,
          "otherUser.role": 1,
          lastMessage: 1,
          lastMessageAt: 1,
          unreadCount: 1,
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};
