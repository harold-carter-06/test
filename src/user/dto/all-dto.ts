import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEmail,
  IsOptional,
  IsArray,
} from 'class-validator';
import { RoleTypes } from '../../roles.decorator';

export interface StaffUserResposne {
  firstName: string;
  id: string;
  lastName: string;
  email: string;
  roles: RoleTypes[];
}
export class AuthCredentialsDto {
  @IsString()
  @IsEmail()
  @MinLength(4)
  @MaxLength(75)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;
}

export class AuthCredentialsDtoForGoogle {
  @IsString()
  token: string;
}

export class changePasswordDTO {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  oldPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword: string;
}
export class SignUpDtoWithGoogle {
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  timezone: string;
}
export class SignUpDto {
  @IsString()
  @IsEmail()
  @MinLength(4)
  @MaxLength(75)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  timezone: string;
}
export class StaffSignUpDto {
  @IsString()
  @IsEmail()
  @MinLength(4)
  @MaxLength(75)
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsArray()
  roles: RoleTypes[];
}

export interface PublicUserInfoData {
  domain: string;
  companyName: string;
  companyLogo: string;
}
