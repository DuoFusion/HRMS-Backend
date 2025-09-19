"use strict"
import nodemailer from 'nodemailer';
import { config } from '../../config';


const option: any = {
    service: "gmail",
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: config.MAIL,
        pass: config.MAIL_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false, // only if needed
    }
}
const transPorter = nodemailer.createTransport(option)


export const email_verification_mail = async (user: any, otp: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const mailOptions = {
      from: `"HRMS Support" <${process.env.MAIL}>`,
      to: user.email,
      subject: "Email Verification - HRMS",
      html: `
      <html lang="en-US">
      <head>
        <meta charset="utf-8" />
        <title>Email Verification</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f9fafb; font-family:Arial, sans-serif;">

        <table width="100%" bgcolor="#f9fafb" cellpadding="0" cellspacing="0" style="padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0" style="border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.08); overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td align="center" bgcolor="#F97316" style="padding:20px;">
                    <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:bold;">HRMS</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:30px; text-align:left; color:#1e293b;">
                    <h2 style="margin:0 0 15px 0; font-size:22px; color:#F97316;">Email Verification</h2>
                    
                    <p style="margin:0 0 20px; font-size:16px; line-height:1.6;">
                      Hi <strong>${user.firstName ?? "Dear"} ${user.lastName ?? ""}</strong>, <br><br>
                      Please use the following OTP to complete your email verification:
                    </p>

                    <p style="font-size:26px; font-weight:bold; color:#F97316; text-align:center; margin:30px 0;">
                      ${otp}
                    </p>

                    <p style="margin:0 0 20px; font-size:14px; color:#64748b;">
                      ⏳ This code is valid only for <strong>2 minutes</strong>. After that, it will expire automatically.
                    </p>
                    
                    <p style="margin:40px 0 0; font-size:14px; color:#94a3b8;">
                      – The HRMS Team
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td bgcolor="#f1f5f9" style="padding:15px; text-align:center; font-size:12px; color:#94a3b8;">
                    &copy; ${new Date().getFullYear()} HRMS. All rights reserved.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>

      </body>
      </html>
      `,
    };
            await transPorter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log("err => ",err)  
                    reject(err)
                } else {
                    resolve(`Email has been sent to ${user.email}, kindly follow the instructions`)
                }
            })
        } catch (error) {
            console.log(error)
            reject(error)
        }
    });
}