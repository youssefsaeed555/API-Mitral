const express = require("express");
const isauth = require("../middleware/is-auth");
const usersControllers = require("../controllers/users");
const router = express.Router();
const { updateProfileUser } = require("../middleware/validator");
router.get("/posts", isauth, usersControllers.getUserPosts);

router.get("/reservation", isauth, usersControllers.getAllReservation);

router.get("/account/profile/:id", isauth, usersControllers.getProfilePatient);

router.put(
  "/account/profile",
  isauth,
  updateProfileUser,
  usersControllers.updateProfile
);

router.put("/account/changePassword", isauth, usersControllers.updatedPassword);

router.delete("/account/profile", isauth, usersControllers.deleteProfile);

module.exports = router;
