const postmarkapp = require("./emailConfig")
const logger = require("../Logger")

export const sendEmail = async (payload) => {
    try {
        let result;
        if (Array.isArray(payload.recipients)) {
            result = await payload.recipients.forEach((recipient) => {
                postmarkapp.sendRawEmail({
                    senderName: payload.senderName,
                    senderEmail: payload.senderEmail,
                    replyTo: payload.replyTo,
                    recipientEmail: recipient.email_recipients,
                    subject: payload.subject,
                    message: payload.body
                })
            })
        } else {
            throw new Error("Cannot send to invalid recipient addresses")
        }
        console.log(result)
        return {
            message: "success",
            result
        }

    } catch (err) {
        logger.error(err)
        return err
    }
}