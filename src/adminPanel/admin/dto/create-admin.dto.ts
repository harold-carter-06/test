import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsString, Length } from "class-validator"

export class loginAdminDto {
  @ApiProperty({example:"john@gmail.com"})
  @IsEmail()
  email: string

  @ApiProperty({example:"5dwdwd4d"})
  @IsString()
  @Length(8, 16)
  password: string
}

export class loginAdminResponseDto {
  @ApiProperty({
    default: 'asdsa21d132as1d32as1d3as1d3as1d3as1d3as1d3as13das',
  })
  accessToken: string
}

export class loginAdminSuccessResponse {
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
  data: loginAdminResponseDto
}

export class loginAdminErrorResponse {
  @ApiProperty({
    default: 400,
  })
  code: number

  @ApiProperty()
  message: string
}