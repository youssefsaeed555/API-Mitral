const Doctor = require("../model/doctor");
const Orders = require("../model/appointment");
const Complaints = require("../model/complaints");
const cloud = require("../middleware/cloudinary");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.getVerfyDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.find(
    { isverfied: false },
    "_id userName photo email license title city gender specialty birthDate"
  );
  res.status(200).json({ message: "الدكاتره الغير متحقق منهم", data: doctor });
});

exports.postVerfyDoctor = asyncHandler(async (req, res, next) => {
  const docId = req.body.userId; //req.body
  const confirm = req.body.confirm; //req.body
  const doctor = await Doctor.findById(docId);
  if (!doctor) {
    return next(new ApiError("هذا الحساب غير موجود", 404));
  }
  if (confirm === true) {
    const accepted = await Doctor.findByIdAndUpdate(docId, {
      isverfied: true,
    });
    res.status(201).json({
      message: "تم التحقق من هذا الحساب",
      _id: accepted._id,
      email: accepted.email,
    });
  } else {
    //delete photo from cloudinary
    await cloud.destroy(doctor.photoId);
    await cloud.destroy(doctor.licenseId);
    await Doctor.findByIdAndDelete(docId);
    res.status(200).json({ message: "تم حذف الحساب لانه غير متحقق منه" });
  }
});

exports.getAcceptedDoctors = asyncHandler(async (req, res, next) => {
  const accepted = await Doctor.find(
    { isverfied: true },
    "_id userName photo email license title city gender specialty birthDate raiting"
  );
  res.status(200).json({ message: "الدكاتره متحقق منهم", data: accepted });
});

exports.filterSearch = asyncHandler(async (req, res, next) => {
  let query = { ...req.query };
  if (req.query.userName) {
    query.userName = { $regex: req.query.userName };
  }
  let findDoctor = await Doctor.find(query)
    .select("userName photo email specialty city birthDate gender raiting")
    .sort({ raiting: -1 });
  if (findDoctor == 0) {
    return next(
      new ApiError(
        "عذرا، لا يمكن العثور على اي طبيب يطابق بحثك، الرجاء ازالة بعض من المرشحات للحصول على النتائج",
        404
      )
    );
  }
  return res.status(200).json({
    message: "تم العثور علي الدكاتره المطلوبه",
    doctors: findDoctor,
  });
});

exports.getAllDoctorsAccounts = asyncHandler(async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const prepage = 10;
  const allDoctors = await Doctor.find()
    .select("userName photo email specialty city birthDate gender raiting")
    .skip((currentPage - 1) * prepage)
    .limit(prepage)
    .sort({ raiting: -1 });
  return res.status(200).json(allDoctors);
});

exports.getAccounts = asyncHandler(async (req, res, next) => {
  let doctorId = req.params.doctorId;
  const doctorData = await Doctor.findById(doctorId).select(
    "userName photo email specialty city birthDate gender raiting"
  );
  if (!doctorData) {
    return next(new ApiError("خطا في التحقق ادخل الدكتور بشكل صحيح", 400));
  }
  const DoctorOrderOnline = await Orders.aggregate([
    {
      $match: {
        reservationPlace: { $in: ["مكالمه فيديو"] },
        doctor: doctorData._id,
        isPaid: true,
      },
    },
    {
      $group: {
        _id: "$reservationPlace",
        totalPaid: { $sum: "$totalPaid" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);
  const DoctorOrderOfline = await Orders.aggregate([
    {
      $match: {
        reservationPlace: { $nin: ["مكالمه فيديو"] },
        doctor: doctorData._id,
      },
    },
    {
      $group: {
        _id: "$reservationPlace",
        totalPaid: { $sum: "$totalPaid" },
        totalOrders: { $sum: 1 },
      },
    },
  ]);
  let totalPaid;
  let totalOrders;
  const online = DoctorOrderOnline.find((x) => {
    return x;
  });
  const offline = DoctorOrderOfline.find((x) => {
    return x;
  });
  if (DoctorOrderOfline.length == 0) {
    if (DoctorOrderOnline.length == 0) {
      totalPaid = 0;
      totalOrders = 0;
    } else {
      totalPaid = online.totalPaid;
      totalOrders = online.totalOrders;
    }
  } else if (DoctorOrderOnline.length == 0) {
    totalPaid = offline.totalPaid;
    totalOrders = offline.totalOrders;
  } else {
    totalPaid = offline.totalPaid + online.totalPaid;
    totalOrders = offline.totalOrders + online.totalOrders;
  }

  const profit = (totalPaid * 10) / 100;
  const totals = {
    totalPaid: totalPaid,
    totalOrders: totalOrders,
    doctorGained: totalPaid - profit,
    profit: profit,
  };

  let doctorResult = {
    doctorData,
    DoctorOrderOnline,
    DoctorOrderOfline,
    totals,
  };
  return res.status(200).json(doctorResult);
});

exports.getDoctorComplaints = asyncHandler(async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const prePage = 10;

  const allDoc = await Doctor.find()
    .select(
      "userName photo email specialty city birthDate gender raiting complaintsMode"
    )
    .where("complaintsMode")
    .equals(true)
    .skip((currentPage - 1) * prePage)
    .limit(prePage)
    .sort({ raiting: -1 });
  return res.status(200).json(allDoc);
});

exports.getComplaintsDoctor = asyncHandler(async (req, res, next) => {
  const doctorId = req.params.doctorId;
  const spesficDoc = await Doctor.findById(doctorId)
    .select(
      "userName photo email specialty city birthDate gender raiting complaints"
    )
    .populate({
      path: "complaints",
      select: "details user createdAt",
      populate: {
        path: "user",
        select: "userName",
      },
    });
  if (!spesficDoc) {
    return next(new ApiError("خطا في التحقق ادخل الدكتور بشكل صحيح", 400));
  }
  if (spesficDoc.complaints.length == 0) {
    return res.json({
      message: "لا يوجد شكاوي",
      complaints: spesficDoc.complaints,
      spesficDoc,
    });
  }
  return res.status(200).json(spesficDoc);
});

exports.deleteProfile = asyncHandler(async (req, res, next) => {
  const docId = req.params.doctorId;

  const deleteDoctor = await Doctor.findById(docId).select("complaints");
  if (!deleteDoctor) {
    return res.status(400).json({ message: "الحساب عير موجود" });
  }
  for (let i = 0; i < deleteDoctor.complaints.length; i++) {
    await Complaints.findOneAndDelete({ _id: deleteDoctor.complaints });
  }
  await deleteDoctor.remove();
  return res.json({ message: "تم حذف الحساب" });
});
