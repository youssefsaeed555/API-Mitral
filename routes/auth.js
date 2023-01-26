const express = require("express");

const router = express.Router();

const multer = require("../middleware/multer");

const authController = require("../controllers/auth");

const {
  signupDocotrValidation,
  signUpUserValidation,
} = require("../middleware/validator");

/*
@DESC To register the doctor 
*/
router.post(
  "/signupDoctor",
  multer.fields([
    { name: "license", maxCount: 1 },
    { name: "photo", maxCount: 1 },
  ]),
  signupDocotrValidation,
  async (req, res, next) => {
    await authController.registerDoctor(req.body, req, "doctor", res, next);
  }
);

/*
@DESC To register the user 
*/
router.post("/signupUser", signUpUserValidation, async (req, res, next) => {
  await authController.registerUser(req.body, req, "user", res, next);
});

/*
@DESC To login the Doctor 
*/
router.post("/loginDoctor", async (req, res, next) => {
  await authController.login(req.body, "doctor", res, next, false);
});

/*
@DESC To login the admin 
*/
router.post("/loginAdmin", async (req, res, next) => {
  await authController.login(req.body, "admin", res, next, true);
});

/*
@DESC To login the user 
*/
router.post("/loginUser", async (req, res, next) => {
  await authController.login(req.body, "user", res, next, true);
});
/*
@DESC To reset password by sending email with token to ur mail 
*/
router.post("/reset", authController.postReset);

/*
@DESC To set the new password 
*/
router.post("/newpassword", authController.postNewPassword);

router.post("/mobileReset", authController.postResetMobile);

router.post("/verfyCode", authController.verfyCode);

router.post("/updatePasswordMobile", authController.updatedPassword);

module.exports = router;
