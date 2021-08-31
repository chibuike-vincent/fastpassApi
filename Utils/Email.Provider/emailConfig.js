const postmark = require('postmark');

const logger = require("../Logger")
const config = require("../../config")


export const sendRawEmail = async (options) => {
    const { senderName,senderEmail, replyTo, recipientEmail, subject, message } = options
    const serverToken = config.POSTMARK_KEY || '';
    const client = new postmark.ServerClient(serverToken);

    /* Send Email using Postmark Templates */
    await client
        .sendEmail({
            From: `${senderName} <${senderEmail}>`,
            To: recipientEmail,
            ReplyTo: replyTo || senderEmail,
            HtmlBody: message,
            Subject: subject,
            TrackOpens: true
        })
        .then((response) => {
            logger.debug(`postmark.sendEmailWithTemplate --> ${JSON.stringify(response)}`);
            return response;
        })
        .catch((err) => {
            logger.error('postmark.sendEmailWithTemplate action failed');
            console.error(err);
        });
};
