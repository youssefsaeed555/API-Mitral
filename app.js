//express app
const express = require("express");
const app = express();

//compress the request to reduce size
const compression = require("compression");

// limit request rate
const rateLimit = require("express-rate-limit");
//prevent http population
const hpp = require("hpp");
// prevent no sql query injection
const mongoSanitize = require("express-mongo-sanitize");
//handling cors error
const cors = require("cors");
const helmet = require("helmet");
//to able join path
const path = require("path");
//api for generate error
const ApiError = require("./utils/errorHandling");
//global error handling
const globalError = require("./middleware/ApiError");
//all env keys
require("dotenv").config();
//db connection
require("./db")();
//to limit the number of requests becouse of broute forrce attack
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message:
    "Too many requestes created from this IP, please try again after an 15 minutes",
});
//server favivon
var favicon = require("serve-favicon");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(cors()); // Use this after the variable declaration
app.use(compression());
// to serve images
app.use(express.static(path.join(__dirname, "uploads")));
app.use(express.json({ limit: "20kb" }));
app.use(mongoSanitize());
app.use(helmet());
app.use(limiter);
app.use(hpp());

const webhook = require("./controllers/reservation");
app.post(
  "/webhook-check-out",
  express.raw({ type: "application/json" }),
  webhook.webhookCheckOut
);

//mounting routes
const auth = require("./routes/auth");
const users = require("./routes/users");
const admin = require("./routes/admin");
const home = require("./routes/home");
const doctor = require("./routes/Doctor");
const reviews = require("./routes/reviews");
const posts = require("./routes/posts");
const doctorCalender = require("./routes/doctorCalender");
const reservation = require("./routes/reservation");
app.use("/auth", auth);
app.use("/user", users);
app.use("/admin", admin);
app.use("/home", home);
app.use("/doctor", doctor);
app.use("/calender", doctorCalender);
app.use(reservation);
app.use(reviews);
app.use("/posts", posts);
app.all("/", (req, res, next) => {
  res.json("welcome in mitral");
});

//handling unexists routes
app.all("*", (req, res, next) => {
  next(new ApiError(`can't found this route: ${req.originalUrl}`, 400));
});

//global error handling
app.use(globalError);

const server = app.listen(process.env.PORT || 8000);

//handling error out express
process.on("unhandledRejection", (err) => {
  console.log(`unhandledRejection ${err.name} | ${err.message}`);
  server.close(() => {
    console.log(`close server ...`);
    process.exit(1);
  });
});
