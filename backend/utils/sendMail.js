const nodemailer = require("nodemailer");

const sendMail = async (email, subject, message) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // Or use SMTP settings
            auth: {
                user: process.env.EMAIL_USER, // Your email (in .env)
                pass: process.env.EMAIL_PASS, // Your password or app password (in .env)
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            text: message,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}`);
    } catch (error) {
        console.error("❌ Error sending email:", error.message);
    }
};

module.exports = sendMail;
