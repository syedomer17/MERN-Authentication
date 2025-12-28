import { createTransport, Transporter } from "nodemailer";

const sendMail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const transport: Transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transport.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};

export default sendMail;
