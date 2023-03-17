export interface sendInvoiceReadySMSType {
  to_phone_number: string;
  companyName: string;
  invoice_ref_id: string;
  invoice_link: string;
  domain: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  textTemplate: string;
}
