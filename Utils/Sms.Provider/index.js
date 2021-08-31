const Vonage = require("@vonage/server-sdk")
const config = require("../../config")

const vonage = new Vonage({
    apiKey: config.Nexmo_apiKey,
    apiSecret: config.Nexmo_apiSecret,
})

export const sendSms = async (payload) => {
    try {
        let result;
        const options = {
            debug: true,
            appendToUserAgent: "fastpass",
            timeout: 10000,
            apiHost: "",
            restHost: ""
        }
        if (Array.isArray(payload.recipients)) {
            result = await payload.recipients.forEach((recipient, index) => {

                vonage.message.sendSms(payload.subject, recipient.sms_recipients, payload.body, options, (err, result) => {
                    if (err) {
                        result = err
                        return;
                    };

                    if (index === payload.recipients.length - 1) {
                        console.log('message sent');
                        result = result
                    }
                });

            })
        } else {
            throw new Error("Cannot send to invalid recipient addresses")
        }
        console.log(result)
        res.status(200).json(result)
    } catch (err) {
        logger.error(err)
        next(err)
    }
}