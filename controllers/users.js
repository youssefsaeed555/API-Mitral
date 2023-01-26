const User = require("../model/users");
const Doctor = require("../model/doctor");
const Post = require("../model/posts");
const appointment = require("../model/appointment");
const { validationResult } = require("express-validator");
const moment = require("moment");
const bcrypt = require("bcryptjs"); //for hash password
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.getUserPosts = asyncHandler(async (req, res, next) => {
  const userPosts = await Post.find({ creator: req.userId }).populate({
    path: "comments",
    select: "-post",
    populate: {
      path: "doctorComment",
      select: "userName photo specialty",
    },
  });
  if (userPosts.length === 0) {
    return next(new ApiError("لا يوجد منشورات", 404));
  }
  return res.status(200).json({ posts: userPosts });
});

exports.getAllReservation = asyncHandler(async (req, res, next) => {
  const appointments = await appointment
    .find({ patient: req.userId, isPaid: true })
    .populate("doctor", "userName photo location")
    .select("-reservationPlace -reservationStatus -phone -name");
  return res.status(200).json(appointments);
});

exports.getProfilePatient = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const profile = await User.findById({ _id: id && req.userId }).select(
    "userName email phone birthDate age"
  );
  if (!profile) {
    return next(new ApiError("غير موجود", 404));
  }
  if (profile._id.toString() != id) {
    return next(new ApiError("خطا في التحقق", 404));
  }
  return res.status(200).json(profile);
});

exports.updateProfile = asyncHandler(async (req, res, next) => {
  let userProfile = await User.findByIdAndUpdate(
    { _id: req.userId },
    { $set: req.body }
  ).select("userName email phone birthDate age roles");

  if (userProfile.roles[0] == "doctor") {
    userProfile = await Doctor.findByIdAndUpdate(
      { _id: req.userId },
      { $set: req.body }
    ).select(
      "userName email phone birthDate title price location specialty city region"
    );
  }
  if (req.body.birthDate) {
    userProfile.birthDate = moment(new Date(userProfile.birthDate)).format(
      "YYYY-MM-DD"
    );
    const date = moment(new Date(), "YYYY-MM-DD");
    const bithdate = moment(req.body.birthDate, "YYYY-MM-DD");
    userProfile.age = moment(date).diff(moment(bithdate), "years");
    await userProfile.save();
  }
  const afterUpdated = await User.findById(req.userId).select(
    "userName email phone birthDate title price location specialty city region"
  );
  return res
    .status(200)
    .json({ message: "تم تحديث البيانات بنجاح", afterUpdated });
});

exports.updatedPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ApiError("كلمه المرور غير متطابقه", 404));
  }
  user.password = await bcrypt.hash(req.body.password, 12);
  await user.save();
  return res.status(200).json({ message: "تم تحديث كلمه المرور بنجاح" });
});

exports.deleteProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.userId);
  if (!user) {
    return next(new ApiError("غير موجود", 404));
  }
  return res.json({ message: "تم حذف الحساب" });
});
