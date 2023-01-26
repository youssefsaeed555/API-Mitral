const mongoose = require("mongoose");
const Connect = async () => {
  // mongodb clund connection
  const con = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB Connected : ${con.connection.host}`);
};

module.exports = Connect;
