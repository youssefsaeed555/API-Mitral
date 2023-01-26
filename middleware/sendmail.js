const nodemailer = require('nodemailer')

const sendmail = async(option)=>
{
    const transport = nodemailer.createTransport({
        service: "Gmail",
        secure:true,
        auth: {
            user: process.env.EMAIL_GMAIL,
            pass: process.env.PASSWORD_GMAIL
        }
    });
    var mailOptions = 
        {
        from: 'UGS.140509@ci.suez.edu.eg',
        to: option.email, 
        subject: 'اعاده تعيين كلمه المرور',
        html:option.message
        } 
    await transport.sendMail(mailOptions)
}

module.exports = sendmail