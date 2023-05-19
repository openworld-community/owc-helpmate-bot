import { SmtpClient } from 'denomailer';

import ENV from './vars.ts';
const { DEBUG, SMTP_HOSTNAME, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM } = ENV;

export const smtp = new SmtpClient();

export const smtpConnect = async (hostname = SMTP_HOSTNAME, port = SMTP_PORT, username = SMTP_USERNAME, password = SMTP_PASSWORD): Promise<void> => (await smtp.connect({ hostname, port, username, password }));

export const smtpSend = async (subject, content, to = SMTP_FROM, from = SMTP_FROM): Promise<void> => (await smtp.send({ subject, content, to, from }));

export const smtpClose = async (): Promise<void> => (await smtp.close());

export const smtpSendOnce = async (subject, content, to = SMTP_FROM, from = SMTP_FROM, hostname = SMTP_HOSTNAME, port = SMTP_PORT, username = SMTP_USERNAME, password = SMTP_PASSWORD): Promise<any> => {
  try {
    await smtpConnect(hostname, port, username, password);
    const sent = await smtpSend(subject, content, to, from);
    await smtpClose();
    return sent;
  } catch (err) {
    if (DEBUG) console.error(err);
    return { err };
  }
};
