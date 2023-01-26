const Doctor = require("../model/doctor");
const moment = require("moment");
const calender = require("../model/doctorCalender");
const teleCalender = require("../model/teleCalender");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.create = asyncHandler(async (req, res, next) => {
  const startAt = moment(req.body.startAt, "h:mm a");
  const endAt = moment(req.body.endAt, "h:mm a");
  const date = moment(req.body.date, "DD-MM-yyyy").format("yyyy-MM-DD");
  const timeDiff = moment.duration(endAt.diff(startAt)).asMinutes();
  if (
    !(timeDiff === 5 || timeDiff === 15 || timeDiff === 30 || timeDiff === 60)
  ) {
    return next(
      new ApiError(
        "خطا في الفتره الزمنيه من فضلك قم ب ادخال الفتره المحدده",
        403
      )
    );
  }
  const checkcalender = await calender.findOne({
    weekday: req.body.weekday,
    startAt: startAt.format("h:mm a"),
    doctor: req.userId,
    date: date,
  });
  if (checkcalender) {
    return next(new ApiError("تم ادخال الميعاد من قبل", 422));
  }
  if (!(req.body.startAt && req.body.endAt && req.body.date)) {
    return next(new ApiError("من فضلك ادخل البيانات المطلوبه", 422));
  }
  let hoursworking;
  if (req.body.type === "online") {
    hoursworking = new teleCalender({
      weekday: req.body.weekday,
      startAt: startAt.format("h:mm a"),
      endAt: endAt.format("h:mm a"),
      duration: timeDiff,
      date: date,
      doctor: req.userId,
    });
    await hoursworking.save();
    await Doctor.findByIdAndUpdate(
      { _id: req.userId },
      { $push: { teleCalender: hoursworking } }
    );
  } else {
    hoursworking = new calender({
      weekday: req.body.weekday,
      startAt: startAt.format("h:mm a"),
      endAt: endAt.format("h:mm a"),
      duration: timeDiff,
      date: date,
      doctor: req.userId,
    });
    await hoursworking.save();
    await Doctor.findByIdAndUpdate(
      { _id: req.userId },
      { $push: { calender: hoursworking } }
    );
  }
  return res
    .status(201)
    .json({ message: "تم تسجيل الميعاد", workingHoursId: hoursworking._id });
});

exports.getWorkingHours = asyncHandler(async (req, res, next) => {
  const workingHours = await calender
    .find({
      doctor: req.userId,
      date: { $gte: moment(Date.now()).format("yyyy-MM-DD") },
    })
    .where("calender")
    .ne("TeleCalender");
  if (req.body.type === "online") {
    const workingHours = await teleCalender.find({
      doctor: req.userId,
      date: { $gte: moment(Date.now()).format("yyyy-MM-DD") },
    });
    return res.status(200).json(workingHours);
  }
  return res.status(200).json(workingHours);
});

exports.getSpesficDay = asyncHandler(async (req, res, next) => {
  let id = req.params.id;
  const spesficDay = await calender.findById(id);
  if (!spesficDay) {
    return next(new ApiError("لا يوجد مواعديد"));
  }
  return res.status(200).json(spesficDay);
});

exports.update = asyncHandler(async (req, res, next) => {
  let id = req.params.id;
  const updated = await calender.findById({ _id: id });
  if (!updated) {
    return next(new ApiError("لا يوجد مواعديد"));
  }
  const date = moment(req.body.date, "DD-MM-yyyy").format("yyyy-MM-DD");
  const startAt = moment(req.body.startAt, "h:mm a");
  const endAt = moment(req.body.endAt, "h:mm a");
  const timeDiff = moment.duration(endAt.diff(startAt)).asMinutes();
  if (
    !(timeDiff === 5 || timeDiff === 15 || timeDiff === 30 || timeDiff === 60)
  ) {
    return next(
      new ApiError(
        "خطا في الفتره الزمنيه من فضلك قم ب ادخال الفتره المحدده",
        422
      )
    );
  }
  const checkcalender = await calender.findOne({
    weekday: req.body.weekday,
    startAt: startAt.format("h:mm a"),
    doctor: req.userId,
    date: date,
  });
  if (checkcalender) {
    return next(new ApiError("تم ادخال الميعاد من قبل", 422));
  }
  updated.weekday = req.body.weekday;
  updated.startAt = startAt.format("h:mm a");
  updated.endAt = endAt.format("h:mm a");
  updated.duration = timeDiff;
  updated.date = date;
  await updated.save();
  return res.status(200).json({ message: "تم تحديث الميعاد", updated });
});

exports.cancel = asyncHandler(async (req, res, next) => {
  const spesficDay = await calender.findById(req.params.id);
  const spesficDoc = await Doctor.findById(req.userId);
  if (!spesficDay) {
    return next(new ApiError("لا يوجد مواعيد", 404));
  }
  //remove relation between doc and calender
  if (req.body.type === "online") {
    spesficDoc.teleCalender.pull(spesficDay);
  }
  spesficDoc.calender.pull(spesficDay);
  await spesficDoc.save();
  await calender.findByIdAndDelete(spesficDay);
  return res.status(200).json({ message: "تم حذف الميعاد" });
});
