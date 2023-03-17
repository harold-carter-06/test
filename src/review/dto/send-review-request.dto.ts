import { IsBoolean, IsString } from 'class-validator';

export class sendReviewRequestDto {
  @IsString()
  name: string;
  @IsString()
  email: string;
  @IsString()
  phone: string;
  @IsString()
  sms_content: string;
  @IsString()
  email_content: string;
  @IsString()
  companyName: string;
  @IsBoolean()
  send_sms: boolean;
  @IsBoolean()
  send_email: boolean;
}
