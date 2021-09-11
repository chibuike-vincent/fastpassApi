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

// Sign up route
exports.signupAdmin = async (req, res) => {
  try {
    const data = req.body;

    const verificationCode = await getPin.pingGen();

    const user = await __Admin.findOne({ email: data.email });

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

    const newUser = await __Admin.create({
      ...data,
      userType: "admin",
      verificationCode
    });

    if (!newUser) {
      return res.send("Error: Error creating account");
    }

    const tokenData = {
      email: newUser.email,
      phone: newUser.phone,
      userType: newUser.userType,
      estatename: newUser.estatename,
      sub: newUser._id,
    };

    const token = await jwt.sign(tokenData, AUTH_SECRET, {
      expiresIn: EXPIRESIN,
    });

    const uri = `${BASE_URI}/admin/verify-account/${newUser._id}/${verificationCode}`;

    const message = await getTemplate(
      "activate",
      {
        fullName: newUser.email.split("@")[0],
        message: `Welcome to FastPass admin portal, please click on the button below to activate your account.`,
        link: uri,
        buttonTitle: "Activate",
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );

    sendEmail(newUser.email, message, "Account Activation")
      .catch((error) => console.error(error));

    return res.json({
      token,
      status: 200,
      message: "Sign up successful. Activation link has been sent to your email. Ensure you activate your account to get the best of FastPass. Thanks",
    });
  } catch (error) {
    console.log(error);
    return res.send(`An error occured: ${error}`);
  }
};

//Admin verify account
exports.adminVerifyAccont = async (req, res) => {
  try {
    const { userId, secretCode } = req.params;

    const user = await __Admin.findOne({ _id: userId });

    if (!user) {
      return res.send("Account not found");
    }

    if (user.verificationCode !== Number(secretCode)) {
      return res.send("wrong credentials provided");
    }
    user.status = "active";
    user.isActive = true;

    user.save();

    return res.render("confirmation");
  } catch (error) {
    console.log(error);
    return res.render("activationError");
  }
};

// Login route controller
exports.loginAdmin = async (req, res) => {
  try {
    const data = req.body;
    const user = await __Admin.findOne({ email: data.email });
    if (!user) {
      return res.send("Error: Account with provided email not found.")
    }
    if (user.isBlocked) {
      return res.send("Error: Account blocked please contact admin")
    }
    if (!user || user === null || user === undefined) {
      return res.send("Error: Email do not match any account.");
    }

    if (!user.isActive) {
      return res.send("Error: Your account has not been verified.");
    }

    const validPassword = await bcrypt.compare(data.password, user.password);

    if (!validPassword) {
      return res.send("Error: Invalid password.Please try again.");
    }
    const tokenData = {
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      fullname: user.fullname,
      sub: user._id,
    };

    const accessToken = await jwt.sign(tokenData, AUTH_SECRET, {
      expiresIn: EXPIRESIN,
    })

    return res.json({
      message: "success",
      user,
      accessToken,
    });
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

// Reset password route controller
exports.adminResetPassword = async (req, res) => {
  try {
    const data = req.body;
    const result = await __Admin.findOne({
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
exports.adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await __Admin.findOne({ email });
    if (!result) {
      return res.send("Error: Account with provided email not found")
    }
    if (result.isBlocked) {
      return res.send("Error: Account blocked please contact admin")
    }
    if (!result) {
      return res.send("Error: Account does not exist with FastPass.");
    }

    const pin = await getPin.pingGen();

    result.resetPasswordPin = pin;
    result.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await result.save();

    const message = await getTemplate(
      "forgotpassword",
      {
        fullName: result.email.split("@")[0],
        message: `If you requested for a password reset service please click the button below else please kindly ignore and keep your account information secure.`,
        link: `${req.headers.origin}/resetpassword/${pin}`,
        buttonTitle: "Reset",
      },
      {
        escape: (html) => {
          return String(html);
        },
      }
    );

    sendEmail(result.email, message, "Reset Password",)
      .catch((error) => console.error(error));
    return res.send("Reset password link has been sent to your email.");
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
};

//change password route controller
exports.adminChangePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const result = await __Admin.findOne({ _id: user.sub });

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
exports.AdminUpdateProfile = async (req, res) => {
  const userId = req.user.sub
  const result = await __Admin.findOneAndUpdate({ _id: userId }, data);
  return res.json({
    message: "Profile updated",
  });
};

exports.adminGetCurrentUser = async (req, res) => {
  const { sub } = req.user;
  const user = await __Admin.findOne({ _id: sub });

  const userData = {
    id: user._id,
    address: user.address,
    email: user.email,
    fullname: user.fullname,
    isActive: user.isActive,
    phone: user.phone
  }
  return res.json({
    status: 200,
    userData,
  });
};

exports.adminCreateTenant = async (req, res) => {
  try {
    const admin = req.user
  const data = req.body
  const code = await getPin.pingGen();
  const password = "Tenant@" + code
  const existing = await __User.findOne({ email: data.email })
  if (existing) {
    return res.send("user with provided email exists.")
  }
  const user = await __User.create({
    ...data,
    password,
    userType: "tenant",
    createdBy: admin._id
  })


  const message = await getTemplate(
    "myAccount",
    {
      fullName: user.email.split("@")[0],
      message: `Your account was successfully created by ${admin.fullname} and login credentials are: Email: ${user.email} and Password: ${password}. Please ensure you change your password after login.`,
      link: ``,
    },
    {
      escape: (html) => {
        return String(html);
      },
    }
  );

  sendEmail(user.email, message, "App account")
    .catch((error) => console.error(error));
  return res.json({
    user,
    message:"success"
  })
  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
}


exports.adminCreateSecurity = async (req, res) => {
  try {
    const admin = req.user
  const data = req.body
  const code = await getPin.pingGen();
  const password = "Sec@" + code
  const existing = await __User.findOne({ email: data.email })
  if (existing) {
    return "user with provided email exists."
  }
  const user = await __User.create({
    ...data,
    password,
    userType: "security",
    createdBy: admin._id
  })


  const message = await getTemplate(
    "myAccount",
    {
      fullName: user.email.split("@")[0],
      message: `Your account was successfully created by ${admin.fullname} and your login credentials are: Email: ${user.email} and Password: ${password}. Please ensure you change your password after login.`,
      link: ``,
    },
    {
      escape: (html) => {
        return String(html);
      },
    }
  );

  sendEmail(user.email, message, "App account")
    .catch((error) => this.log().error(error));

  return res.json({
    message: "success",
    user
  })

  } catch (error) {
    return res.send(`An error occured: ${error}`);
  }
}

exports.adminGetAllTenants = async (req, res) => {
  const admin = req.user
  const user = await __User.find({
    $and: [{ createdBy: admin._id }, { userType: "tenant" }]
  })

  if (user) {
    res.json({
      message: "success",
      user
    })
  } else {
    res.status(404).json({
      message: "Failed"
    })
  }
}

exports.adminGetAllSecurity = async (req, res) => {
  const admin = req.user
  const user = await __User.find({
    $and: [{ createdBy: admin._id }, { userType: "security" }]
  })

  if (user) {
    res.json({
      message: "success",
      user
    })
  } else {
    res.status(404).json({
      message: "Failed"
    })
  }
}

exports.adminGetTenant = async (req, res) => {
  const admin = req.user
  const { tenantId } = req.params
  const user = await __User.findOne({
    $and: [{ createdBy: admin._id }, { _id: tenantId }]
  })

  if (user) {
    res.json({
      message: "success",
      user
    })
  } else {
    res.status(404).json({
      message: "Failed"
    })
  }
}

exports.adminGetSecurity = async (req, res) => {
  const admin = req.user
  const { securityId } = req.params
  const user = await __User.findOne({
    $and: [{ createdBy: admin._id }, { _id: securityId }]
  })

  if (user) {
    res.json({
      message: "success",
      user
    })
  } else {
    res.status(404).json({
      message: "Failed"
    })
  }
}

exports.adminDeleteTenant = async (req, res) => {
  const tenantId = req.params.tenantId
  const deleted = await __User.findOneAndDelete({
    $and: [{ _id: tenantId }, { userType: "tenant" }]
  })

  if (deleted) {
    res.json({
      message: "success",
      deleted
    })
  } else {
    res.status(404).json({
      message: "Failed"
    })
  }
}

exports.adminUnblockUser = async (req, res) => {
  try {
    const { email } = req.body
    const updated = await __User.findOneAndUpdate(email, { isBlocked: false })
    if (updated) {
      res.send("user successfully unblocked")
    } else {
      res.send("Error unblocking user please check provided email.")
    }
  } catch (error) {
    res.send("Error:", error)
  }
}

exports.superAdminUnblockAdmin = async (req, res) => {
  try {
    const { email } = req.body
    const updated = await __Admin.findOneAndUpdate(email, { isBlocked: false })
    if (updated) {
      res.send("user successfully unblocked")
    } else {
      res.send("Error unblocking user please check provided email.")
    }
  } catch (error) {
    res.send("Error:", error)
  }
}

exports.adminDeleteSecurity = async (req, res) => {
  const securityId = req.params.securityId
  const deleted = await __User.findOneAndDelete({
    $and: [{ _id: securityId }, { userType: "security" }]
  })

  if (deleted) {
    res.json({
      message: "success",
      deleted
    })
  } else {
    res.status(404).json({
      message: "Failed"
    })
  }
}

