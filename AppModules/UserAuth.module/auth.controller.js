const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");

const __UserData = require("./auth.model");
const EmailUtils = require("../../utils/emailService");
const Generator = require("../../utils/codeGenerate");
const { validatePassword } = require("../../utils/passwordValidator");

const {
  REFRESHTOKEN_SECRET,
  AUTH_SECRET,
  EXPIRESIN,
  refreshTokenExpires,
  BASE_URI,
} = require("../../config/index");

const emailService = new EmailUtils();
const getPin = new Generator();

// Sign up route
exports.signup = async (req, res) => {
  try {
    const data = req.body;

    const secretCode = await getPin.pingGen();

    const user = await __UserData.findOne({ email: data.email });

    if (user) {
      return res.send("Error: User with same email already registered.");
    }

    if (data.password !== data.repeatPassword) {
      return res.send("Password must match.");
    }

    const passwordPattern = await validatePassword();

    if (!data.password.match(passwordPattern)) {
      return res.send(
        "Password must be more than 8 characters and contain atleast one capital letter and one special character."
      );
    }

    const newUser = await __UserData.create({
      ...data,
      userType: "user",
      disclaimerAccepted: false,
      voilationCode: 0,
      active: 0,
      status: "inactive",
      isBlocked: true,
      isActive: false,
      secretCode,
      domain: data.email.split("@")[1],
    });

    if (!newUser) {
      return res.send("Error: Error creating account");
    }

    const tokenData = {
      email: newUser.email,
      organizationName: newUser.organizationName,
      branchName: newUser.branchName,
      sub: newUser._id,
    };

    const accessToken = await jwt.sign(tokenData, AUTH_SECRET, {
      expiresIn: EXPIRESIN,
    });
    const refreshToken = await jwt.sign(tokenData, REFRESHTOKEN_SECRET, {
      expiresIn: refreshTokenExpires,
    });

    newUser.refreshToken = refreshToken;

    await newUser.save();

    const uri = `${BASE_URI}/api/auth/verify-account/${newUser._id}/${secretCode}`;

    const message = await emailService.getTemplate(
      "template",
      {
        fullName: newUser.email.split("@")[0],
        message: `Welcome to Gehring services, please click on the button below to activate your account.`,
        link: uri,
        buttonTitle: "Activate",
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );
    emailService
      .sendMail(newUser.email, message, "Account activation")
      .catch((error) => this.log().error(error));

    return res.json({
      accessToken,
      refreshToken,
      status: 200,
      message: "Activation link has been sent to your email.",
    });
  } catch (error) {
    console.log(error);
    return res.send(`An error occured: ${error}`);
  }
};

//User verify account
exports.VerifyAccont = async (req, res) => {
  try {
    const { userId, secretCode } = req.params;

    const user = await __UserData.findOne({ _id: userId });

    if (!user) {
      return res.send("Account not found");
    }

    if (user.secretCode !== Number(secretCode)) {
      return res.send("wrong credentials provided");
    }

    user.voilationCode = 1;
    user.active = 1;
    user.status = "active";
    user.isBlocked = false;
    user.isActive = true;

    user.save();

    return res.render("confirmation");
  } catch (error) {
    console.log(error);
    return res.render("activationError");
  }
};

// Login route controller
exports.loginUser = async (req, res) => {
  try {
    const data = req.body;
    const user = await __UserData.findOne({ email: data.email });
    if (!user || user === null || user === undefined) {
      return res.send("Error: Email do not match any account.");
    }

    if (!user.isActive) {
      return res.send("Error: Your account has not been activated.");
    }

    if (user.isBlocked) {
      return res.send("Error: Your account has been blocked, Contact admin.");
    }

    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.send("Invalid password.  Please try again.");
    }
    const tokenData = {
      email: user.email,
      organizationName: user.organizationName,
      branchName: user.branchName,
      sub: user._id,
    };

    const accessToken = await jwt.sign(tokenData, AUTH_SECRET, {
      expiresIn: EXPIRESIN,
    });
    const refreshToken = await jwt.sign(tokenData, REFRESHTOKEN_SECRET, {
      expiresIn: refreshTokenExpires,
    });

    user.refreshToken = refreshToken;

    await user.save();

    return res.json({
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

// Reset password route controller
exports.resetPassword = async (req, res) => {
  try {
    const data = req.body;
    const result = await __UserData.findOne({
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

    const tokenData = {
      email: result.email,
      firstname: result.firstName,
      lastname: result.lastName,
      sub: result._id,
      phone: result.phone,
    };

    const accessToken = await jwt.sign(tokenData, AUTH_SECRET, {
      expiresIn: EXPIRESIN,
    });
    const refreshToken = await jwt.sign(tokenData, REFRESHTOKEN_SECRET, {
      expiresIn: refreshTokenExpires,
    });

    result.resetPasswordPin = undefined;
    result.resetPasswordExpires = undefined;
    result.password = data.password;
    result.refreshToken = refreshToken;

    await result.save();

    return res.json({
      accessToken,
      refreshToken,
      message: "Password reset successful",
    });
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

// forgot Password route controller
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await __UserData.findOne({ email: email });
    if (!result) {
      return res.send("error: Account does not exist with Gehiring.");
    }

    if (result.isBlocked) {
      return res.send("error: Your account has been blocked, Contact admin.");
    }

    const pin = await getPin.pingGen();
    result.resetPasswordPin = pin;
    result.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await result.save();

    const message = await emailService.getTemplate(
      "template",
      {
        fullName: result.email.split("@")[0],
        message: `Reset password for Gehring services, please click on the button below to reset your password.`,
        link: `${req.headers.origin}/reset_password/${pin}`,
        buttonTitle: "Reset",
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );
    emailService
      .sendMail(result.email, message, "Reset Password")
      .catch((error) => this.log().error(error));
    return res.send("Reset password link has been sent to your email.");
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

//change password route controller
exports.changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const result = await __UserData.findOne({ email: user.email });

    if (!result) {
      return res.send("Account does not exist with Gehiring.");
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

    const message = await emailService.getTemplate(
      "forgotPassword",
      {
        fullName: result.email.split("@")[0],
        message: `You have successfully changed your password. If you never requested for a change of password please follow the link below to update your account`,
        link: `${req.headers.origin}/`,
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );
    emailService
      .sendMail(result.email, message, "Change Password")
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
exports.updateProfile = async (req, res) => {
  const { userId, username, organisationname, branchname, country, userlevel } =
    req.body;
  const result = await __UserData.findOne({ _id: userId });
  if (!result) {
    return res.send("Account not found");
  }
  result.username = username;
  result.organisationname = organisationname;
  result.branchname = branchname;
  result.country = country;
  result.userlevel = userlevel;
  result.isProfileUpdated = true;

  await result.save();
  return res.json({
    user: result,
    message: "Profile updated",
  });
};

// Accept disclaimer route
exports.acceptDisclaimer = async (req, res) => {
  const { userId } = req.body;
  const result = await __UserData.findOne({ _id: userId });
  if (!result) {
    return res.send("Account not found");
  }
  result.disclaimerAccepted = true;
  result.isActive = true;

  await result.save();
  return res.json({
    user: result,
    message: "Disclaimer accepted",
  });
};

//Admin unblock a user route
exports.adminUnblockUser = async (req, res) => {
  const { email } = req.body;
  const user = await __UserData.findOne({ email });
  if (!user) {
    return res.send(`No user with ${email} found`);
  }
  if (!user.isBlocked) {
    return res.send(`User with ${email} is currently active`);
  }

  user.isBlocked = false;
  await user.save();

  return res.send("User unblocked");
};

exports.getCurrentUser = async (req, res) => {
  const { email } = req.user;
  const user = await __UserData.findOne({ email });
  return res.json({
    status: 200,
    user,
  });
};
