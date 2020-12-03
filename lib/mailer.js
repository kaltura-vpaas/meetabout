var nodemailer = require('nodemailer');

function getTransporter() {

    //let testAccount = await nodemailer.createTestAccount();
    // create reusable transporter object using the default SMTP transport
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
      },
    });
    
}

module.exports = getTransporter