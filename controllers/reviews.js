const Doctor = require("../model/doctor");
const Reviews = require("../model/reviews");
const complaints = require("../model/complaints");
const moment = require("moment");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.postReview = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.doctorId;
  const spesficDoc = await Doctor.findById(doctorId).populate(
    "reviews",
    "user rating"
  );
  //population to alllow me to access user in reviews
  const newReview = new Reviews({
    name: req.body.name,
    rating: Math.round(req.body.rating),
    comment: req.body.comment,
    user: req.userId,
    doctor: spesficDoc._id,
    time: moment(Date.now()).format("L"),
  });
  //Don't allow more than one review per user
  for (var i = 0; i < spesficDoc.reviews.length; i++) {
    if (spesficDoc.reviews[i].user.toString() === req.userId.toString()) {
      return next(new ApiError("لقد قمت ب التقييم من قبل", 400));
    }
  }
  // Don't allow the doctor to post a review on himself.
  if (req.userId.toString() === spesficDoc._id.toString()) {
    return next(new ApiError("عفوا لا يمكنك التقييم", 400));
  }
  spesficDoc.reviews.push(newReview);

  //calculate the total num of reviews
  spesficDoc.numReviews = spesficDoc.reviews.length;

  //calculate the average of raiting
  for (var i = 0; i < spesficDoc.reviews.length; i++) {
    spesficDoc.raiting =
      spesficDoc.reviews.reduce((acc, item) => acc + item.rating, 0) /
      spesficDoc.reviews.length;
  }
  await spesficDoc.save();
  await newReview.save();
  res
    .status(201)
    .json({ message: "تم اضافه التقييم", reviewId: newReview._id });
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.doctorId;
  const reviewId = req.params.reviewId;

  const review = await Reviews.findById(reviewId);

  const spesficDoc = await Doctor.findById(doctorId).populate(
    "reviews",
    "user rating"
  );
  //if not found the id of review
  if (!review) {
    return next(new ApiError("هذا التقييم غير موجود", 400));
  }
  //to ensure that user has delted own review only
  if (review.user.toString() === req.userId.toString()) {
    //to remove relation between doctor and reviews
    spesficDoc.reviews.pull(review._id);

    //to edit the number of total reviews after delete one
    spesficDoc.numReviews = spesficDoc.reviews.length;

    //to remove review
    review.remove();

    //to recalculate reviews affter delete one
    //in this loop i<=length to enter in the loop and check if condtion
    for (var i = 0; i <= spesficDoc.reviews.length; i++) {
      if (spesficDoc.reviews.length == 0) {
        //if no reviews on doctor model then average raiting = 0
        spesficDoc.raiting = 0;
      } else {
        //recalualte after delete one
        spesficDoc.raiting =
          spesficDoc.reviews.reduce((acc, item) => acc + item.rating, 0) /
          spesficDoc.reviews.length;
      }
    }
    //save spesficDoc after remove review and edit average raitng
    await spesficDoc.save();
    return res.status(200).json({ message: "تم حذف تقييمك" });
  } else {
    //if user on review collection !== req.userId
    return res.status(401).json({ message: "لا يمكنكك حذف هذا التقييم " });
  }
});

exports.addComplaints = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.doctorId;
  const spesficDoc = await Doctor.findById(doctorId);
  if (!spesficDoc) {
    return next(new ApiError("هذا الدكتور غير موجود", 404));
  }
  const newComplaint = new complaints({
    details: req.body.details,
    user: req.userId,
    doctor: spesficDoc._id,
  });
  await newComplaint.save();
  spesficDoc.complaintsMode = true;
  spesficDoc.complaints.push(newComplaint);
  await spesficDoc.save();
  return res.status(200).json({ message: "تم اضافه شكوتك بنجاح" });
});
