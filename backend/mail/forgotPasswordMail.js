const nodemailer = require('nodemailer');
const forgotPasswordTemplate = require('./templates/forgotPassword.template');
require('dotenv').config();

const forgotPasswordMailer = (user, link) => {
    let mailOptions = {
        from: process.env.MAIL_NAME_FORGOT_PASSWORD,
        to: user.email,
        subject: 'Password Reset',
        html: forgotPasswordTemplate(user, link),
    };
    let mailConfig = {
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secureConnection: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
        tls: {
            ciphers: 'SSLv3',
        },
    };
    if (!mailConfig.auth.user) {
        delete mailConfig.auth;
    }
    const transporter = nodemailer.createTransport(mailConfig);
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
module.exports = forgotPasswordMailer;
