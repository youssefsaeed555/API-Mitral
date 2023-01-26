const Doctor = require("../model/doctor");
const appointments = require("../model/appointment");
const moment = require("moment");
const twilioSms = require("../middleware/twilioSms");
const cloud = require("../middleware/cloudinary");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.getProfile = asyncHandler(async (req, res, next) => {
  const docId = req.params.doctorId;
  const spesficDoc = await Doctor.findById(docId)
    .select(
      "userName title photo price location birthDate specialty calender teleCalender reviews raiting numReviews city region gender"
    )
    .populate("calender", "weekday startAt endAt duration date")
    .populate("teleCalender", "weekday startAt endAt duration date")
    .populate("reviews", "-user");
  if (!spesficDoc) {
    return next(new ApiError("غير موجود", 404));
  }
  return res.status(200).json(spesficDoc);
});

exports.getDoctorPhoto = asyncHandler(async (req, res, next) => {
  const docId = req.params.doctorId;
  const spesficDoc = await Doctor.findById(docId).select("photo");
  if (!spesficDoc) {
    return next(new ApiError("غير موجود", 404));
  }
  return res.status(200).json(spesficDoc);
});

exports.updatePhoto = asyncHandler(async (req, res, next) => {
  const spesficDoc = await Doctor.findById(req.userId).select("photo photoId");
  if (!spesficDoc) {
    return next(new ApiError("غير موجود", 404));
  }
  if (!req.file) {
    return next(new ApiError("من فضلك قم برفع صورتك الشخصيه", 422));
  }
  await cloud.destroy(spesficDoc.photoId);
  const photoPath = req.file.path;
  const photoUploaderCloudinary = await cloud.uploads(photoPath);

  spesficDoc.photo = photoUploaderCloudinary.url;
  spesficDoc.photoId = photoUploaderCloudinary.id;
  await spesficDoc.save();
  fs.unlinkSync(photoPath);
  return res.status(200).json({
    message: "تم تحديث صورتك بنجاح",
    photo: spesficDoc.photo,
    photoId: spesficDoc.id,
  });
});

exports.getReservationDay = asyncHandler(async (req, res, next) => {
  const time = req.body.time;
  const doctor = req.userId;
  const reservation = await appointments
    .find({ doctor: doctor, time: moment(time).format("yyyy-MM-DD") })
    .populate("patient", "userName gender birthDate");
  if (!time) {
    return next(new ApiError("من فضلك ارسل  الميعاد المحدد", 422));
  }
  return res.status(200).json({ totalRes: reservation.length, reservation });
});

exports.getAllReservation = asyncHandler(async (req, res, next) => {
  const getAllReservation = await appointments
    .find({ doctor: req.userId })
    .populate("patient", "userName gender birthDate age");
  return res
    .status(200)
    .json({ totalRes: getAllReservation.length, getAllReservation });
});

exports.getReservationDayById = asyncHandler(async (req, res, next) => {
  const status = req.body.status;
  const id = req.params.id;
  const reservationDayById = await appointments
    .findById(id)
    .populate("patient", "userName gender birthDate age")
    .populate("doctor", "userName photo");
  if (!reservationDayById) {
    return next(new ApiError("غير موجود", 404));
  }
  if (status === true) {
    reservationDayById.reservationStatus = true;
    reservationDayById.isPaid = true;
    reservationDayById.save();
    //twilioSms.statusReservationTrue(reservationDayById)
    return res.status(200).json({ message: "تم الكشف" });
  }
  if (status === false) {
    //twilioSms.statusReservationFalse(reservationDayById)
    return res.json({ message: "متاخر" });
  } else {
    return res.json(reservationDayById);
  }
});

exports.deleteReservation = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const appointement = await appointments.findByIdAndRemove(id);
  if (!appointement) {
    return next(new ApiError("غير موجود", 404));
  }
  return res.status(200).json({ message: "تم حذف هذا الميعاد" });
});
