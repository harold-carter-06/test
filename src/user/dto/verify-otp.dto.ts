import { ApiProperty } from '@nestjs/swagger';

export class verifyOtpDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  otp: string;
}

export class verifyOtpResponseDto {
  @ApiProperty({
    default: 'asdsa21d132as1d32as1d3as1d3as1d3as1d3as1d3as13das',
  })
  accessToken: string;
}

export class verifyOtpSuccessResponse {
  @ApiProperty({
    default: 200,
  })
  responseCode: number;

  @ApiProperty({
    default: 'otp verified successfully',
  })
  responseMessage: string;

  @ApiProperty({
    required: false,
  })
  responseData: verifyOtpResponseDto;
}

export class verifyOtpErrorResponse {
  @ApiProperty({
    default: 400,
  })
  responseCode: number;

  @ApiProperty()
  responseMessage: string;
}
