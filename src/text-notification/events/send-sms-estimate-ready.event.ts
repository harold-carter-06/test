export interface sendEstimateReadySMSType {
  to_phone_number: string;
  companyName: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  estimate_ref_id: string;
  estimate_link: string;
  domain: string;
  textTemplate: string;
}
