const express = require("express");

const router = express.Router();

const adminController = require("../controllers/admin");

const gaurd = require("../middleware/is-auth");

/*
@DESC To get and post all docotors that not veried yet 
*/
router
  .route("/verfy-doctors")
  .get(gaurd, adminController.getVerfyDoctor)
  .post(gaurd, adminController.postVerfyDoctor);

/*
@DESC To get all docotors after veried
*/
router.get("/accepted-doctors", gaurd, adminController.getAcceptedDoctors);

router.get("/search", gaurd, adminController.filterSearch);

router.get(
  "/accounts/allDoctors",
  gaurd,
  adminController.getAllDoctorsAccounts
);

router.get("/accounts/:doctorId", gaurd, adminController.getAccounts);

router.get(
  "/complaints/allDoctors",
  gaurd,
  adminController.getDoctorComplaints
);

router.get("/complaints/:doctorId", gaurd, adminController.getComplaintsDoctor);

router.delete("/deleteDoctor/:doctorId", gaurd, adminController.deleteProfile);

module.exports = router;
