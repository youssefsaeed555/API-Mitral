const Doctor = require("../model/doctor");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.searchquery = asyncHandler(async (req, res, next) => {
  //to limit number of doctor returned
  const currentPage = req.query.page || 1;
  const prepage = 10;
  let query = { ...req.query };
  if (req.query.page) {
    query.page = currentPage;
  }
  if (req.query.price) {
    let toString = JSON.stringify(req.query.price);
    toString = toString.replace(/\b(gt|gte|lte|lt)\b/g, (match) => `$${match}`);
    query.price = JSON.parse(toString);
  }
  if (req.query.userName) {
    query.userName = { $regex: req.query.userName };
  }
  let findDoctor = Doctor.find(query)
    .select(
      "userName photo price specialty title region gender city birthDate location phone calender raiting numReviews"
    )
    .populate("calender");

  const count = await findDoctor.clone().countDocuments();
  findDoctor.skip((currentPage - 1) * prepage).limit(prepage);
  if (req.query.sorts) {
    findDoctor = findDoctor.sort(req.query.sorts);
  }
  const result = await findDoctor;
  if (result.length == 0) {
    return next(
      new ApiError(
        "عذرا، لا يمكن العثور على اي طبيب يطابق بحثك، الرجاء ازالة بعض من المرشحات للحصول على النتائج",
        404
      )
    );
  }
  return res.status(200).json({
    message: "تم العثور علي الدكاتره المطلوبه",
    totalDoc: count,
    doctors: result,
  });
});

exports.filterOnline = asyncHandler(async (req, res, next) => {
  //to limit number of doctor returned
  const currentPage = req.query.page || 1;
  const prepage = 10;
  let query = { ...req.query };
  if (req.query.page) {
    query.page = currentPage;
  }
  if (req.query.price) {
    let toString = JSON.stringify(req.query.price);
    toString = toString.replace(/\b(gt|gte|lte|lt)\b/g, (match) => `$${match}`);
    query.price = JSON.parse(toString);
  }
  if (req.query.userName) {
    query.userName = { $regex: req.query.userName };
  }
  let findDoctor = Doctor.find(query)
    .where("online")
    .equals(true)
    .populate("teleCalender");

  const count = await findDoctor.clone().countDocuments();
  findDoctor
    .select(
      "userName photo specialty price region title gender city birthDate location phone teleCalender raiting numReviews"
    )
    .skip((currentPage - 1) * prepage)
    .limit(prepage);
  if (req.query.sorts) {
    findDoctor = findDoctor.sort(req.query.sorts);
  }
  const result = await findDoctor;
  if (result.length == 0) {
    return next(
      new ApiError(
        "عذرا، لا يمكن العثور على اي طبيب يطابق بحثك، الرجاء ازالة بعض من المرشحات للحصول على النتائج",
        404
      )
    );
  }
  return res.status(200).json({
    message: "تم العثور علي الدكاتره المطلوبه",
    totalDoc: count,
    doctors: result,
  });
});
