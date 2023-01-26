const accountSid = process.env.ACCOUNT_SID_TWILIO
const authToken = process.env.AUTH_TOKEN_TWILIO 
const client = require('twilio')(accountSid, authToken); 
exports.sensmessage = (appointmentData) =>{
client.messages 
      .create({ 
         body: `مرحبا ${appointmentData.name}
          ميترال يؤكد حجز موعدك يوم  ${appointmentData.time} الساعه ${appointmentData.start} في ${appointmentData.reservationPlace} ${appointmentData.meeting}
            `,  
         messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
         to: `${appointmentData.phone}` 
       }) 
      .then(message=>{}) 
      .done();
}

exports.sensmessagedoctor = (appointmentData) =>{
   client.messages 
         .create({ 
            body: `مرحبا 
             ميترال يؤكد حجز موعد يوم  ${appointmentData.time} الساعه ${appointmentData.start} في ${appointmentData.reservationPlace} ${appointmentData.meeting}
               `,  
            messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
            to: `${appointmentData.phone}` 
          }) 
         .then(message=>{}) 
         .done();
   }   


   exports.sensmessageoffline = (appointmentData) =>{
      client.messages 
            .create({ 
               body: `مرحبا 
                ميترال يؤكد حجز موعد يوم  ${appointmentData.time} الساعه ${appointmentData.start} في ${appointmentData.reservationPlace}
                  `,  
               messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
               to: `${appointmentData.phone}` 
             }) 
            .then(message=>{}) 
            .done();
      }   

exports.sensUpdateMessage = (appointmentData) =>{
      client.messages 
            .create({ 
               body: `مرحبا ${appointmentData.name}
                ميترال يخبرك بتتغير حجز موعدك يوم  ${appointmentData.time}
                 الساعه ${appointmentData.start} 
                  `,  
               messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
               to: `${appointmentData.phone}` 
             }) 
            .then(message=>{}) 
            .done();
}
exports.cancelMessage = (appointmentData) =>{
      client.messages 
            .create({ 
               body: `مرحبا ${appointmentData.name}
                  ميترال يخبرك بالغاء حجزك
                  `,  
               messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
               to: `${appointmentData.phone}` 
             }) 
            .then(message=>{}) 
            .done();
}

exports.statusReservationFalse = (appointmentData) =>{
   client.messages 
         .create({ 
            body: `
            مرحبا ${appointmentData.name}
              ابلغنا دكتور ${appointmentData.doctor.userName} انك لم تذهب الي العياده 
               `,  
            messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
            to: `${appointmentData.phone}` 
          }) 
         .then(message=>{}) 
         .done();
}
exports.statusReservationTrue = (appointmentData) =>{
   client.messages 
         .create({ 
            body: `
            مرحبا ${appointmentData.name}
            شكرا لاستخدامك ميترال ابلغنا دكتور ${appointmentData.doctor.userName} انك قمت بزياره العياده لتتقيم زيارتك ادخل علي موقعنا 
               `,  
            messagingServiceSid: process.env.MESSAGING_SERVICE_ID_TWILIO,      
            to: `${appointmentData.phone}` 
          }) 
         .then(message=>{}) 
         .done();
}