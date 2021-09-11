const nodeMailer = require("nodemailer");

  exports.mailer = async(emails, message, subject, fromWho)=> {
    let transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: "chibuikepatrick2@gmail.com",
        pass: "ghwfzvleykfshiea",
      },
      tls: { rejectUnauthorized: false },
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: fromWho ? fromWho : '"FastPass" <fastpass@dev.io>', // sender address
      // bcc : fromWho ? "info@embed.ng" : emails , // list of receivers
      to: fromWho ? "support@fastpass.io" : emails, // list of receivers
      subject: subject, // Subject line
      html: message, // html body
    });
    return "Done";
  }

  exports.mailerTester = async(emails, message, subject, fromWho) =>{
    // Generate test SMTP service account fromWho ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodeMailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodeMailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: fromWho ? fromWho : '"FastPass" <fastpass@dev.io>', // sender address
      // bcc : fromWho ? "info@embed.ng" : emails , // list of receivers
      to: fromWho ? "support@fastpass.io" : emails, // list of receivers
      subject: subject, // Subject line
      html: message, // html body
    });
    console.info("Message sent: %s", info.messageId);
    console.info("Preview URL: %s", nodeMailer.getTestMessageUrl(info));
  }

  
