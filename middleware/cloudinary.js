const cloudinary = require('cloudinary')

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY_CLOUDINARY, 
    api_secret: process.env.API_SECRET_CLOUDINARY 
  });
exports.uploads = (file) =>{
        return new Promise(resolve => {
        cloudinary.uploader.upload(file, (result) =>{
        resolve({url: result.url, id: result.public_id})
        }, {resource_type: "auto"})
        })
    }
exports.destroy= (file) =>{
  return new Promise(resolve => {
  cloudinary.uploader.destroy(file, (result) =>{
  resolve({id: result.public_id})
  })
  })
}
