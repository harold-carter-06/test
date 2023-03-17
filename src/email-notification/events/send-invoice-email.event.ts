export interface sendInvoiceEmailType {
  from_email: string;
  domain: string;
  companyLogo: string;
  companyEmail: string;
  textTemplate: string;
  to_phone_number: string;
  companyName: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  invoice_ref_id: string;
  invoice_link: string;
}
