const express = require("express");
const router = express.Router();
const homeController = require("../controllers/home");

router.get("/doctor", homeController.searchquery);

router.get("/teleHealthDoctor", homeController.filterOnline);

module.exports = router;
