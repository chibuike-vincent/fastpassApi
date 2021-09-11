const mailer = require("./emailConfig")
const {NODE_ENV} = require("../../config")



exports.sendEmail = async(emails, message, subject, fromWho) => {
    NODE_ENV === "development" ? await mailer.mailerTester(emails, message, subject, fromWho) : await mailer.mailer(emails, message, subject, fromWho);
   }
