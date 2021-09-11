const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");


const __Admin = require("../../AppModels/Admin.model/admin.model");
const __User = require("../../AppModels/User.model/userModel")
const { getTemplate } = require("../../Utils/Email.Provider/getTemplates");
const { sendEmail } = require("../../Utils/Email.Provider/sendEmail")
const Pin = require("../../Utils/CodeGenerator/pin");
const { validatePassword } = require("../../Utils/Validator/password");

const {
  AUTH_SECRET,
  EXPIRESIN,
  BASE_URI,
} = require("../../config/index");

const getPin = new Pin();




// Login route controller
exports.loginUser = async (req, res) => {
  try {
    const data = req.body;
    const user = await __User.findOne({ email: data.email });
    if(user.isBlocked){
      return res.send("Account blocked please contact admin")
    }
    if (!user || user === null || user === undefined) {
      return res.send("Error: Email do not match any account.");
    }

    if (!user.isActive) {
      return res.send("Error: Your account has not been verified.");
    }

    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.send("Invalid password.Please try again.");
    }
    const tokenData = {
      email: user.email,
      phone: user.phone,
      fullname: user.firstName + " " + user.lastName,
      userType: user.userType,
      address: user.address,
      sub: user._id,
    };

    const accessToken = await jwt.sign(tokenData, AUTH_SECRET, {
      expiresIn: EXPIRESIN,
    })

    return res.json({
      user,
      accessToken,
    });
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

// Reset password route controller
exports.userResetPassword = async (req, res) => {
  try {
    const data = req.body;
    const result = await __User.findOne({
      $and: [
        { resetPasswordPin: data.pin },
        {
          resetPasswordExpires: { $gt: Date.now() },
        },
      ],
    });

    if (!result) {
      return res.send("Expired or invalid password reset pin");
    }

    const passwordPattern = await validatePassword();

    if (!data.password.match(passwordPattern)) {
      return res.send(
        "Password must be more than 8 characters and contain atleast one capital letter and one special character."
      );
    }

    if (data.password !== data.confirmPassword) {
      return res.send("Password do not match!");
    }

    result.resetPasswordPin = undefined;
    result.resetPasswordExpires = undefined;
    result.password = data.password;

    await result.save();

    return res.json({
      status: 200,
      message: "Password reset successful",
    });
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

// forgot Password route controller
exports.userForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await __User.findOne({ email });
    if(result.isBlocked){
      return res.send("Account blocked please contact admin")
    }
    if (!result) {
      return res.send("error: Account does not exist with FastPass.");
    }

    const pin = await getPin.pingGen();

    result.resetPasswordPin = pin;
    result.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await result.save();

    const message = await getTemplate(
      "forgotpassword",
      {
        fullName: result.email.split("@")[0],
        message: `Your password reset code is ${pin}. Please use within the next 1 hour.`,
        link: "",
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );

    const msgPayload = {
      senderName: "FastPass",
      senderEmail: "fastpass@dev.io",
      replyTo: "fastpass@dev.io",
      recipientEmail: result.email,
      subject: "Reset Password",
      message: message
    }

    sendEmail(msgPayload)
      .catch((error) => console.error(error));
    return res.send("Reset password code has been sent to your email.");
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

//change password route controller
exports.userChangePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const result = await __User.findOne({ email: user.email });

    if (!result) {
      return res.send("Account does not exist with Fastpass.");
    }

    const passwordPattern = await validatePassword();

    if (!newPassword.match(passwordPattern)) {
      return res.send(
        "Password must be more than 8 characters and contain atleast one capital letter and one special character."
      );
    }

    if (newPassword !== confirmPassword) {
      return res.send("Please confirm your password");
    }

    const validPassword = await bcrypt.compare(
      currentPassword,
      result.password
    );

    if (!validPassword) {
      return res.send("Invalid current password entered");
    }

    result.password = newPassword;
    await result.save();

    const message = await getTemplate(
      "changePassword",
      {
        fullName: result.email.split("@")[0],
        message: `You have successfully changed your password. If you never requested for a change of password please follow the link below to update your account`,
        link: `${req.headers.origin}/`,
        buttonTitle: "Goto Site"
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );

    const msgPayload = {
      senderName: "FastPass",
      senderEmail: "fastpass@dev.io",
      replyTo: "fastpass@dev.io",
      recipientEmail: result.email,
      subject: "Reset Password",
      message: message
    }

    sendMail(msgPayload)
      .catch((error) => this.log().error(error));
    return res.json({
      message: "Your password has been changed successfully",
      user: result,
    });
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

// Update profile route
exports.userUpdateProfile = async (req, res) => {
const userId = req.user.sub
  const result = await __User.findOneAndUpdate({ _id: userId }, data );
  return res.json({
    message: "Profile updated",
  });
};

exports.getCurrentUser = async (req, res) => {
  const { email } = req.user;
  const user = await __User.findOne({ email });
  return res.json({
    status: 200,
    user,
  });
};

