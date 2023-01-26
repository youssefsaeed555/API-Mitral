const appointment = require("../model/appointment");
var moment = require("moment");
const User = require("../model/users");
const Doctor = require("../model/doctor");
const stripe = require("stripe")(process.env.STRIPE_SECERT);
const sendsms = require("../middleware/twilioSms");
const meeting = require("../middleware/dailyco");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/errorHandling");

exports.create = asyncHandler(async (req, res, next) => {
  let convert = moment(req.body.start, ["h:mm a"]).format("HH:mm");
  let createAppointment;
  let time = req.body.time;
  let timeFormat = moment(time).format("yyyy-MM-DD");
  const start = moment(req.body.start, "h:mm a").format("h:mm a");
  const meetingStart = moment.utc(
    Math.floor(new Date(timeFormat + "T" + convert).getTime() / 1000)
  );
  const patient = await User.findById(req.userId);
  const doctor = await Doctor.findById(req.body.doctor);
  if (req.body.type === "online") {
    if (!(req.body.start && req.body.time)) {
      return next(new ApiError("ادخل الميعاد والوقت الذي تريدهم", 401));
    }
    const foundApppoitment = await appointment
      .findOne({
        doctor: req.body.doctor,
        start: start,
        time: timeFormat,
        isPaid: true,
      })
      .where("reservationPlace")
      .equals("مكالمه فيديو");
    if (foundApppoitment) {
      return next(new ApiError("هذا الميعاد غير متاح", 401));
    }
    createAppointment = new appointment({
      ...req.body,
      start: start,
      patient: patient,
      reservationPlace: "مكالمه فيديو",
      phone: "+2" + req.body.phone,
      meetingStart: meetingStart,
      time: timeFormat,
    });
  }
  if (req.body.type !== "online") {
    if (!(req.body.start && req.body.time)) {
      return next(new ApiError("ادخل الميعاد والوقت الذي تريدهم", 401));
    }
    const foundApppoitment = await appointment
      .findOne({ doctor: req.body.doctor, start: start, time: timeFormat })
      .where("reservationPlace")
      .ne("مكالمه فيديو");
    if (foundApppoitment) {
      return next(new ApiError("هذا الميعاد غير متاح", 401));
    }
    createAppointment = new appointment({
      ...req.body,
      start: start,
      phone: "+2" + req.body.phone,
      patient: patient,
      reservationPlace: doctor.location + " " + doctor.region,
      totalPaid: doctor.price,
      isPaid: true,
      time: timeFormat,
    });
    //sendsms.sensmessageoffline(createAppointment);
  }
  if (patient.roles != "user") {
    return next(new ApiError("لا يمكنك الحجز", 400));
  } else {
    await createAppointment.save();
    await appointment.findById(createAppointment._id);
    //sendsms.sensmessage(appointmentId)
    return res
      .status(201)
      .json({ message: "تم حجز موعدك بنجاح", id: createAppointment._id });
  }
});

exports.cheeckOutSession = asyncHandler(async (req, res, next) => {
  //get reservation Id and price of docotr
  const appointmentId = await appointment
    .findById(req.params.id)
    .populate("doctor", "price")
    .populate("patient", "userName email");
  if (!appointmentId) {
    return next(new ApiError("الحجز غير موجود", 400));
  }
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        name: appointmentId.patient.userName,
        amount: appointmentId.doctor.price * 100,
        currency: "egp",
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:4200/user/my-reservation",
    cancel_url: "http://localhost:4200/user/my-reservation",
    customer_email: appointmentId.patient.email,
    client_reference_id: appointmentId._id.toString(),
  });
  return res.status(200).json({ status: "success", session });
});

const createMeeting = async (session) => {
  let newRoom;
  let roomId = Math.floor(100000000 + Math.random() * 900000000).toString();
  const reservationId = session.client_reference_id;
  const totalPaid = session.amount_total / 100;
  const appointmentId = await appointment.findById(reservationId);
  const room = await meeting.getRoom(roomId);
  if (room.error) {
    newRoom = await meeting.createRoom(roomId, appointmentId.meetingStart);
  }
  if (room.error !== "not-found") {
    return res.status(400).json({ message: "خطا اثناء انشاء مكالمه الفيديو" });
  }
  appointmentId.meeting = newRoom.url;
  appointmentId.meetingName = newRoom.name;
  appointmentId.totalPaid = totalPaid;
  appointmentId.paidAt = moment(Date.now()).format("YYYY-MM-DD hh:mm z");
  appointmentId.isPaid = true;
  appointmentId.meetingStart = undefined;
  //sendsms.sensmessagedoctor(appointmentId);
  appointmentId.save();
};

exports.webhookCheckOut = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.WEBHOOK_SECRET_STRIPE
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    createMeeting(event.data.object);
  }
  return res.json({ recived: true });
};

exports.getSpesficReservation = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const appointmentId = await appointment
    .findById(id)
    .select("-reservationStatus -meetingName -meetingStart -meetingId")
    .populate({
      path: "doctor",
      select: "userName photo city specialty location region",
    })
    .populate({
      path: "patient",
      select: "userName ",
    });
  if (!appointmentId) {
    return next(new ApiError("غير موجود", 404));
  }
  res.status(200).json(appointmentId);
});
exports.updateReservatiob = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const start = moment(req.body.start, "h:mm a").format("h:mm a");
  const { doctor, name, phone, time } = req.body;
  const appointmentId = await appointment.findById({ _id: id });
  const checktime = await appointment.findOne({
    doctor: req.body.doctor,
    start: start,
    time: moment(time).format("yyyy-MM-DD"),
  });
  if (!appointmentId) {
    return next(new ApiError("غير موجود", 404));
  }
  if (checktime) {
    return next(new ApiError("هذا الميعاد غير متاح", 404));
  }
  appointmentId.doctor = doctor;
  appointmentId.name = name;
  appointmentId.phone = phone;
  appointmentId.start = start;
  appointmentId.time = moment(time).format("yyyy-MM-DD");
  await appointmentId.save();
  //sendsms.sensUpdateMessage(appointmentId);
  return res.status(201).json(appointmentId);
});

exports.cancel = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const findReservationId = await appointment.findById(id);
  if (!findReservationId) {
    return next(new ApiError("هذا الميعاد غير موجود", 404));
  }
  await meeting.deleteRoom(findReservationId.meetingName);
  //sendsms.cancelMessage(findReservationId)
  await appointment.findByIdAndRemove(id);
  res.status(200).json({ message: "تم حذف هذا الميعاد" });
});

exports.getAllReservations = asyncHandler(async (req, res, next) => {
  const allReservations = await appointment
    .find({ patient: req.userId, isPaid: true })
    .select("-reservationStatus -meetingName -meetingStart -meetingId")
    .populate({
      path: "doctor",
      select: "userName photo city specialty location region",
    })
    .populate({
      path: "patient",
      select: "userName ",
    });
  if (allReservations.length == 0) {
    return next(new ApiError("لا يوجد حجوزات", 404));
  }
  return res.json({
    totalReservations: allReservations.length,
    allReservations,
  });
});
