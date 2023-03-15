import { ApiProperty } from '@nestjs/swagger'
import {
  IsEmail,
  IsString,
  IsOptional,
  Length,
} from 'class-validator'

export class signupUserDto {

  @ApiProperty({example:"john"})
  @IsOptional()
  @IsString()
  @Length(3, 50)
  firstName: string

  @ApiProperty({example:"doe"})
  @IsOptional()
  @IsString()
  @Length(3, 50)
  lastName: string

  @ApiProperty({example:"johny"})
  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(3, 50)
  userName: string

  @ApiProperty({example:"john@gmail.com"})
  @IsOptional()
  @IsEmail()
  email: string

  @ApiProperty({example:"5dwdwd4d"})
  @IsOptional()
  @IsString()
  @Length(8, 16)
  password: string

  @ApiProperty({example:"1148488181848"})
  @IsOptional()
  @IsString()
  dateOfBirth: string

  @ApiProperty({example:"1=male 2=female 3=others 4=notToSay"})
  @IsOptional()
  @IsString()
  gender: string
}

export class signupUserResponseDto {
  @ApiProperty({
    default: 'asdsa21d132as1d32as1d3as1d3as1d3as1d3as1d3as13das',
  })
  accessToken: string
}

export class signupUserSuccessResponse {
  @ApiProperty({
    default: 200,
  })
  code: number

  @ApiProperty({
    default: 'signup_success',
  })
  message: string

  @ApiProperty({
    required: false,
  })
  data: signupUserResponseDto
}

export class signupUserErrorResponse {
  @ApiProperty({
    default: 400,
  })
  code: number

  @ApiProperty()
  message: string
}
