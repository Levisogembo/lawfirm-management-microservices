import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer'
import * as path from 'path'

@Injectable()
export class CaseEmailsService {
    private transporter: nodemailer.Transporter

    constructor(private configService: ConfigService){
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
            logger: true,
            debug: true,
            tls: {
                rejectUnauthorized: false
            }
        })
    }

    async sendEmailNotifcation(to:string,assignedBy:string,caseName:string){
        try {
            const info = await this.transporter.sendMail({
                from: this.configService.get<string>("SMTP_USER"),
                to,
                subject: `New Case Assigned - ${caseName}`,
                text: `You have been assigned a new case. Please log in to see more details on the task`,
                attachments: [
                    {
                        filename: "justice.png",
                        path: path.resolve("./src/utils/logos/justice.png"),
                        cid: "companyLogo",
                    },
                ],
                html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="cid:companyLogo" alt="Company Logo" width="120" style="display:block;margin:auto;" />
                </div>
                
                <!-- Heading -->
                <h2 style="color: #333; text-align: center;">New Case Assigned!</h2>
                
                <!-- Message -->
                <p style="color: #555; font-size: 14px; line-height: 1.6;">
                  Hi there,<br/><br/>
                  You have been assigned a new Case. Please log in to the site to see the Case details.
                  <br/><br/>
                  <b> Case Name: ${caseName} </b><br/><br/>
                  <b> Assigned By: ${assignedBy} </b>
                </p>
                
                <!-- Footer -->
                <p style="color: #999; font-size: 12px; text-align: center;">
                  © ${new Date().getFullYear()} LawFirm. All rights reserved.<br/>
                  This is an automated message, please do not reply.
                </p>
              </div>
            `,
            });
            console.log("email successfully sent to:", info.messageId);
            return { status: "success" };
        } catch (error) {
            return { status: "err", message: error.message };
        }
    }
}
