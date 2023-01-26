const express = require("express");
const isauth = require("../middleware/is-auth");
const usersControllers = require("../controllers/reservation");
const router = express.Router();

router.post("/createReservation", isauth, usersControllers.create);

router.get("/checkout-session/:id", isauth, usersControllers.cheeckOutSession);

router.get("/allReservations", isauth, usersControllers.getAllReservations);

router
  .route("/reservation/:id")
  .get(isauth, usersControllers.getSpesficReservation)
  .put(isauth, usersControllers.updateReservatiob)
  .delete(isauth, usersControllers.cancel);

module.exports = router;
