export class sendEmailDto {
  from: string;
  html_content: string;
  text_content: string;
  subject: string;
  reply_to_addresses: string[];
  cc_addresses: string[];
  to_addresses: string[];
}
