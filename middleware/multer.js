const multer = require('multer') // to serve files
const storage = multer.diskStorage({
    destination:(req,file,cb)=>
    {
        cb(null, 'uploads');
    },
    filename:(req,file,cb)=>
    {
        cb(null,Date.now().toString() + file.originalname)
    }
})
const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

module.exports = multer({storage:storage,limits:{fileSize:1024*1024*5},fileFilter:fileFilter})