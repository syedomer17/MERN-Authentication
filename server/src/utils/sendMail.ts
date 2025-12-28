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
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  await transport.sendMail({
    from: `"${process.env.USER_EMAIL}" <${process.env.USER_EMAIL}>`,
    to,
    subject,
    html,
  });
};

export default sendMail;
