const mongoose = require('mongoose')

const Schema = mongoose.Schema

const calender = require('../model/doctorCalender')

const teleCalender = new Schema({

},{discriminatorKey:'calender'})

module.exports = calender.discriminator ('TeleCalender',teleCalender)
