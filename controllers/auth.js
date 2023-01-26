const User = require("../model/users");
const Doctor = require("../model/doctor");
const bcrypt = require("bcryptjs"); //for hash password
const jwt = require("jsonwebtoken"); // for create token
const crypto = require("crypto"); // create random token
const cloud = require("../middleware/cloudinary");
const fs = require("fs");
const moment = require("moment");
const sendMail = require("../middleware/sendmail");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

/*describe To regirster the doctor*/
exports.registerDoctor = asyncHandler(
  async (userData, req, roles, res, next) => {
    const files = req.files;
    if (!files.license) {
      return next(new ApiError("من فضلك قم برفع شهاده مزاوله المهنه"), 422);
    }
    if (!files.photo) {
      return next(new ApiError("من فضلك قم برفع صورتك الشخصيه"), 422);
    }
    //to ensure that path belogs to that filed
    const licencePath = req.files.license[0].path;
    const photoPath = req.files.photo[0].path;

    //to upload in cloudinary
    const license = await cloud.uploads(licencePath);
    const photo = await cloud.uploads(photoPath);
    //to save url cludinary inro db
    userData.license = license.url;
    userData.photo = photo.url;
    userData.photoId = photo.id;
    userData.licenseId = license.id;

    // Get the hashed password
    const password = await bcrypt.hash(userData.password, 12);

    //convert birthdate to age befor saving to db
    const date = moment(new Date(), "dd/mm/yyyy");
    const bithdate = moment(userData.birthDate, "dd/mm/yyyy");
    userData.birthDate = moment(date).diff(moment(bithdate), "years");
    // create a new user
    const newUser = new Doctor({ ...userData, password, roles });
    await newUser.save();

    //deleted photo from uploads file
    fs.unlinkSync(req.files.license[0].path);
    fs.unlinkSync(req.files.photo[0].path);

    // create a token and sent into header
    return res.status(201).json({
      message: "تم الستجيل بنجاح مرحبا بك في مترال",
      userId: newUser._id,
    });
  }
);

/*describe To regirster the user*/
exports.registerUser = asyncHandler(async (userData, req, roles, res, next) => {
  // Get the hashed password
  const password = await bcrypt.hash(userData.password, 12);
  //convert birthdate to age befor saving to db
  userData.birthDate = moment(userData.birthDate).format("YYYY-MM-DD");
  const date = moment(new Date(), "YYYY-MM-DD");
  const bithdate = moment(userData.birthDate, "YYYY-MM-DD");
  userData.age = moment(date).diff(moment(bithdate), "years");
  // create a new user
  const newUser = new User({ ...userData, password, roles });
  await newUser.save();
  // create a token and sent into header
  return res.status(201).json({
    message: "تم الستجيل بنجاح مرحبا بك في مترال",
    userId: newUser._id,
  });
});

/*describe To Login the user (ADMIN, DOCTOR, USER)*/
exports.login = asyncHandler(async (userData, roles, res, next, join) => {
  let { password } = userData;
  // First Check if the email is in the database
  const user = await User.findOne({ email: userData.email });
  if (!user) {
    return next(new ApiError("خطا في البريد الالكتروني", 422));
  }
  // We will check the role
  if (user.roles != roles) {
    return next(
      new ApiError("يرجى التأكد من تسجيل الدخول من البوابة الصحيحة", 403)
    );
  }
  // That means user is existing and trying to signin fro the right portal

  //this is check to stricked unverfied doctor until accept or reject
  if (user.isverfied === join) {
    return next(
      new ApiError("هذا الحساب غير مصرح له بالدخول او قيد التحقق", 403)
    );
  }
  // Now check for the password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new ApiError("خطا في كلمه المرور", 422));
  }
  // Sign in the token
  const token = jwt.sign(
    {
      email: user.email,
      userName: user.userName,
      userId: user._id.toString(),
      role: user.roles,
    },
    process.env.SECRET_JWT,
    { expiresIn: process.env.EXPIRE_JWT }
  );
  //return res.status(200).header('token',token).json({message:"تسجيل الدخول بنجاح",userId:user._id.toString(),role:user.roles})
  return res.status(200).json({
    message: "تسجيل الدخول بنجاح",
    userId: user._id.toString(),
    role: user.roles,
    token: token,
  });
});

/*
    describe To reset the password by sending email for target mail (ADMIN, DOCTOR, USER)
*/
exports.postReset = asyncHandler(async (req, res, next) => {
  //first find email for user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    //if user not found
    return next(new ApiError("خطا في البريد الالكتروني", 422));
  }
  //create random token
  const buffer = crypto.randomBytes(32);
  const token = buffer.toString("hex");
  user.resetToken = token; //save token in user db
  user.resetTokenExpiration = Date.now() + 10 * 60 * 1000; // token expire after 10 minutes
  await user.save(); //save token and expire in user
  const message = `<div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;"><h2 style="text-align: center; text-transform: uppercase;color: #068bc9;">مرحبا بك في mitral</h2><h1>اعاده تعيين كلمه المرور</h1><p> مرحبا بك<span style= "text-transform: uppercase;color: #068bc9;">${user.userName}</span> اضغط علي هذا الرابط <a href="http://localhost:4200/user/reset-password/${token}/${user._id})" style="background: #068bc9; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block;">link</a> لاعاده تعيين كلمه مرور جديده.</p></div>`;
  //send email with token for user in email
  await sendMail({ email: user.email, message: message });
  return res
    .status(200)
    .json({ message: "تم ارسال الرساله بنجاح الي بريدك الالكتروني" });
});

/*
    describe To set the new password (ADMIN, DOCTOR, USER)
*/
exports.postNewPassword = asyncHandler(async (req, res, next) => {
  const newPassword = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  //find user its token in db === to token send in email to verfy that is actual user want to update password
  const user = await User.findOne({
    resetToken: passwordToken,
    _id: userId,
    resetTokenExpiration: { $gt: Date.now() },
  });
  if (confirmPassword !== newPassword) {
    return next(new ApiError("كلمه المرور غير متطابقه", 422));
  }
  if (!user) {
    return next(
      new ApiError(
        "خطا اثناء تحديث كلمه المرور قم باعاده عمليه ارسال البريد الالكتروني مره اخري",
        422
      )
    );
  }
  const password = await bcrypt.hash(newPassword, 12);
  user.password = password;
  user.resetTokenExpiration = undefined; //to delete token savd in user db after reset password
  user.resetToken = undefined;
  await user.save();
  return res.status(201).json({ message: "تم تحديث كلمه المرور بنجاح" });
});

//to reset password for mobile

exports.postResetMobile = asyncHandler(async (req, res, next) => {
  //first find email for user
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    //if user not found
    return next(new ApiError("خطا في البريد الالكتروني", 422));
  }
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const cryptoHashCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");
  //create random token
  user.resetToken = cryptoHashCode; //save token in user db
  user.resetTokenExpiration = Date.now() + 10 * 60 * 1000; // token expire after 10 minutes
  user.passwordTokenVerfied = false;
  await user.save(); //save token and expire in user
  //send email with token for user in email
  const message = `
          <div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
          <h2 style="text-align: center; text-transform: uppercase;color: #068bc9;">مرحبا بك في mitral</h2>
          <h1>اعاده تعيين كلمه المرور</h1>
          <p> مرحبا بك<span style= "text-transform: uppercase;color: #068bc9;">${user.userName}</span><br>كود اعاده التعيين هو : <h3>${resetCode}</h3> </br>
          </div>`;
  await sendMail({ email: user.email, message: message });
  return res
    .status(200)
    .json({ message: "تم ارسال الرساله بنجاح الي بريدك الالكتروني" });
});

exports.verfyCode = asyncHandler(async (req, res, next) => {
  const passwordToken = crypto
    .createHash("sha256")
    .update(req.body.code)
    .digest("hex");
  //find user its token in db === to token send in email to verfy that is actual user want to update password
  const user = await User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError(" الكود خطا او غير متاح", 422));
  }
  user.passwordTokenVerfied = true;
  user.save();
  return res.status(201).json({ message: "تم بنجاح" });
});

exports.updatedPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ApiError("خطا في البريد الالكتروني", 422));
  }
  if (!user.passwordTokenVerfied) {
    return next(new ApiError(" الكود غير متحقق منه", 422));
  }
  if (!(req.body.password || req.body.confirmPassword)) {
    return next(new ApiError(" كلمه السر مطلوبه", 422));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ApiError("كلمه المرور غير متطابقه", 422));
  }
  user.password = await bcrypt.hash(req.body.password, 12);
  user.resetTokenExpiration = undefined; //to delete token savd in user db after reset password
  user.resetToken = undefined;
  user.passwordTokenVerfied = undefined;
  await user.save();
  return res.status(200).json({ message: "تم تحديث كلمه المرور بنجاح" });
};
