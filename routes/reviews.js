const express = require("express");
const routes = express.Router();
const reviewController = require("../controllers/reviews");
const guard = require("../middleware/is-auth");

routes.post("/doctor/:doctorId/review", guard, reviewController.postReview);

routes.delete(
  "/doctor/:doctorId/review/:reviewId",
  guard,
  reviewController.deleteReview
);

routes.post(
  "/doctor/complaints/:doctorId",
  guard,
  reviewController.addComplaints
);

module.exports = routes;
