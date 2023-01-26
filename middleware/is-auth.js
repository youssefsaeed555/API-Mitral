const jwt = require('jsonwebtoken')
// this middleware for autherization user 
module.exports = (req,res,next) =>
{
    //we add this check to improved way to handle error
    const authHeader = req.get('token')
    if(!authHeader)
    {
        const error = new error ('هذا المتسخدم غير مصرح ')
        error.statuscode = 401
        throw error
    }
    const token = authHeader
    let decodedToken
    try 
    {
        decodedToken = jwt.verify(token,process.env.SECRET_JWT) //decoded and verfy
    } 
    catch (error) //if technical occured
    {
        error.statuscode = 500
        throw error
    }
    //if not technical occured but not verfied token with secetkey
    if(!decodedToken) 
    {
        const error = new Error('هذا المستخدم غير مصرح له بفعل هذا')
        error.statuscode = 401
        throw error
    }
    req.userId = decodedToken.userId //decode userId sent in token in header and set it to req for user
    next()
}