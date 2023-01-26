const Doctor = require("../model/doctor");
const User = require("../model/users");
const { body, check } = require("express-validator");
const validation = require("../utils/expressValidator");

exports.signUpUserValidation = [
  check("email", "ادخل ايميل من فضلك")
    .isEmail()
    .trim()
    .custom(async (value, { req }) => {
      const userDoc = await User.findOne({ email: value }); // validate the email
      if (userDoc) {
        throw new Error("هذا الايميل مستخدم بالفعل من فضلك ادخل واحد اخر");
      }
      return true;
    }),
  body("password", "من فضلك ادخل حروف وارقام فقط ولا تقل كلمه المرور عن 8")
    .isLength({ min: 8 })
    .trim(),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("تأكيد كلمة المرور غير متطابق");
    } else {
      return true;
    }
  }),
  validation,
];

exports.signupDocotrValidation = [
  check("email", "please enter a vaild email ")
    .isEmail()
    .trim()
    .custom(async (value, { req }) => {
      const userDoc = await Doctor.findOne({ email: value }); // validate the email
      if (userDoc) {
        throw new Error("هذا الايميل مستخدم بالفعل من فضلك ادخل واحد اخر");
      }
      return true;
    }),
  // validate the password
  body("password", "من فضلك ادخل حروف وارقام فقط ولا تقل كلمه المرور عن 8")
    .isLength({ min: 8 })
    .trim(),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("تأكيد كلمة المرور غير متطابق");
    } else {
      return true;
    }
  }),
  body("userName", "اسم المستخدم مطلوب") // validate the username
    .trim()
    .notEmpty(),
  body("phone", "من فضلك ادخل رقم هاتف صحيح") // validate the phone
    .isNumeric()
    .trim()
    .isLength({ max: 11 })
    .custom(async (value, { req }) => {
      const userPhone = await Doctor.findOne({ phone: req.body.phone });
      if (userPhone) {
        throw new Error("هذا الرقم مستخدم بلفعل من فضلك ادخل رقم اخر");
      }
      return true;
    }),
  validation,
];

exports.postValidator = [
  body("title", "من فضلك ادخل عنوان السؤال")
    .isLength({ min: 20 })
    .withMessage("ادخل سؤالك بما لا يقل عن 20 حرف"),
  body("content", "من فضلك ادخل تفاصيل السؤال")
    .isLength({ min: 50, max: 300 })
    .withMessage("ادخل سؤالك بما لا يقل عن 50 ولا يزيد عن 300 حرف"),
  body("specialty").not().isEmpty().withMessage("من فضلك ادخل التخصص"),
  validation,
];

exports.updatePostValidator = [
  check("title")
    .isLength({ min: 20 })
    .withMessage("ادخل سؤالك بما لا يقل عن 20 حرف"),
  check("content")
    .isLength({ min: 50, max: 300 })
    .withMessage("ادخل سؤالك بما لا يقل عن 50 ولا يزيد عن 300 حرف"),
  validation,
];

exports.updateProfileUser = [
  body("email", "من فضلك ادخل الايميل بشكل صحيح")
    .optional({ nullable: true })
    .isEmail()
    .normalizeEmail()
    .trim(),
  body("phone", "من فضلك ادخل رقم هاتف صحيح") // validate the phone
    .optional({ nullable: true })
    .isNumeric()
    .trim()
    .isLength({ max: 11 }),
  body("birthDate", "ادخل التاريخ بشكل صحيح") // validate the phone
    .optional({ nullable: true }),
  validation,
];
