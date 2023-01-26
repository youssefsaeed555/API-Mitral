const Post = require("../model/posts");
const Users = require("../model/users");
const Doctor = require("../model/doctor");
const Comments = require("../model/comments");
const moment = require("moment");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.addpost = asyncHandler(async (req, res, next) => {
  const user = await Users.findById(req.userId);
  if (user.roles == "doctor") {
    return next(new ApiError("لا يمكنك نشر منشورات", 401));
  }
  const newPost = new Post({ ...req.body, creator: req.userId });
  await newPost.save();
  user.posts.push(newPost);
  await user.save();
  return res
    .status(200)
    .json({ message: "تم اضافه منشورك بنجاح", postId: newPost._id });
});

exports.getAllPosts = asyncHandler(async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const prePage = 10;
  let filter = { ...req.query };
  const totalPosts = await Post.find().countDocuments();
  const posts = await Post.find(filter)
    .select("-comments")
    .skip((currentPage - 1) * prePage)
    .limit(prePage)
    .populate("creator", "_id userName");
  if (posts.length == 0) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  return res.json({
    meaage: "تم العثور علي المنشورات",
    posts: posts,
    totalPosts: totalPosts,
  });
});

exports.getSpesficPost = asyncHandler(async (req, res, next) => {
  const postId = req.params.postId;
  const spesficPost = await Post.findById(postId)
    .populate("creator", "_id userName")
    .populate({
      path: "comments",
      select: "-post",
      populate: {
        path: "doctorComment",
        select: "userName photo specialty",
      },
    });
  if (!spesficPost) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  return res.status(200).json({ post: spesficPost });
});

exports.updatePost = asyncHandler(async (req, res, next) => {
  const postId = req.params.postId;
  const spesficPost = await Post.findById(postId).populate(
    "creator",
    "_id userName"
  );
  if (!spesficPost) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  if (req.userId != spesficPost.creator._id.toString()) {
    return next(new ApiError("غير مصرح لك بتعديل هذا المنشور", 404));
  }
  const updated = await Post.findOneAndUpdate(
    { _id: spesficPost },
    { $set: req.body }
  ).populate("creator", "_id userName");
  return res.json({ message: "تم تحديث المنشور", post: updated });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  const postId = req.params.postId;
  const user = await Users.findById(req.userId);
  const spesficPost = await Post.findById(postId).populate(
    "creator",
    "_id userName"
  );
  if (!spesficPost) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  if (spesficPost.creator._id.toString() != req.userId) {
    return next(new ApiError("لا يمكنك حذف المنشور", 404));
  }
  user.posts.pull(spesficPost._id);
  await user.save();
  await spesficPost.remove();
  return res.json({ message: "تم حذف المنشور" });
});

exports.addComment = asyncHandler(async (req, res, next) => {
  const postId = req.params.postId;
  const spesficPost = await Post.findById(postId).populate(
    "creator",
    "_id userName"
  );
  if (!spesficPost) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  const user = await Users.findById(req.userId);
  if (user.roles[0] != "doctor") {
    return next(new ApiError("لا يمكنك الرد خاص ب الدكتور", 401));
  }
  const checkDoc = await Doctor.findById(req.userId);
  const newComment = new Comments({
    comment: req.body.comment,
    doctorComment: checkDoc,
    post: spesficPost,
    time: moment(Date.now()).format("llll"),
  });
  await newComment.save();

  spesficPost.comments.push(newComment);
  await spesficPost.save();

  checkDoc.comments.push(newComment);
  await checkDoc.save();

  return res.json({
    message: "تم اضافه تعليقك بنجاح",
    commentId: newComment._id,
  });
});

exports.updateComment = asyncHandler(async (req, res, next) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  const spesficPost = await Post.findById(postId).populate(
    "creator",
    "_id userName"
  );
  if (!spesficPost) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  const spesficComment = await Comments.findById(commentId);
  if (!spesficComment) {
    return next(new ApiError("لم يتم العثور علي التعليق", 404));
  }
  const user = await Users.findById(req.userId);
  const doctor = await Doctor.findById(req.userId);
  if (
    user.roles[0] != "doctor" ||
    doctor._id.toString() != spesficComment.doctorComment.toString()
  ) {
    return next(new ApiError("لا يمكنك تعديل هذا التعليق", 401));
  }
  spesficComment.comment = req.body.comment;
  await spesficComment.save();
  return res
    .status(200)
    .json({ message: "تم تعديل التعليق", updated: spesficComment.comment });
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const postId = req.params.postId;
  const commentId = req.params.commentId;
  const spesficPost = await Post.findById(postId).populate(
    "creator",
    "_id userName"
  );
  if (!spesficPost) {
    return next(new ApiError("لم يتم العثور علي منشورات", 404));
  }
  const spesficComment = await Comments.findById(commentId);
  if (!spesficComment) {
    return next(new ApiError("لا يتم العثور علي هذا التعليق", 401));
  }
  const user = await Users.findById(req.userId);
  const doctor = await Doctor.findById(req.userId);
  if (
    user.roles[0] != "doctor" ||
    doctor._id.toString() != spesficComment.doctorComment.toString()
  ) {
    return next(new ApiError("لا يمكنك حذف هذا التعليق", 401));
  }
  doctor.comments.pull(spesficComment._id);
  await doctor.save();

  spesficPost.comments.pull(spesficComment._id);
  await spesficPost.save();

  await spesficComment.remove();
  return res.json({ message: "تم حذف التعليق" });
});
