const express = require("express");

const routes = express.Router();
const controller = require("../controllers/doctorCalender");
const auth = require("../middleware/is-auth");

routes.post("/create", auth, controller.create);

routes.get("/workingHours", auth, controller.getWorkingHours);

routes
  .route("/spesficDay/:id")
  .get(auth, controller.getSpesficDay)
  .put(auth, controller.update)
  .delete(auth, controller.cancel);

module.exports = routes;
