const express = require("express");

const routes = express.Router();
const controller = require("../controllers/doctor");
const auth = require("../middleware/is-auth");
const { updateProfileUser } = require("../middleware/validator");
const updateProfileController = require("../controllers/users");
const upload = require("../middleware/multer");

routes.get("/account/profile/:doctorId", controller.getProfile);

routes.put(
  "/account/profile",
  auth,
  updateProfileUser,
  updateProfileController.updateProfile
);

routes.put(
  "/account/changePassword",
  auth,
  updateProfileController.updatedPassword
);

routes.delete("/account/profile", auth, updateProfileController.deleteProfile);

routes.get("/account/photo/:doctorId", controller.getDoctorPhoto);

routes.put(
  "/account/updatePhoto",
  auth,
  upload.single("photo"),
  controller.updatePhoto
);

routes.get("/getAllResrvationDay", auth, controller.getAllReservation);

routes.get("/getResrvationDay", auth, controller.getReservationDay);

routes.post("/verifyStatus/:id", auth, controller.getReservationDayById);

routes.delete("/getResrvationDay/:id", auth, controller.deleteReservation);

module.exports = routes;
