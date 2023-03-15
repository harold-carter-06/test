import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional, Length } from "class-validator";

export class googleLoginDto {
  @ApiProperty({
    example:
      "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg1ODI4YzU5Mjg0YTY5YjU0YjI3NDgzZTQ4N2MzYmQ0NmNkMmEyYjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNTk5NTA1NzQ1MjMzLWVqZWkyMXNhOGk5bGtvNXR2aG4zcG0zbWw1Z2hjYjI2LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNTk5NTA1NzQ1MjMzLWVqZWkyMXNhOGk5bGtvNXR2aG4zcG0zbWw1Z2hjYjI2LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2Nzk3NDkzNzE4MzQzNTU1NzIwIiwiZW1haWwiOiJraWVyYW5jb2xsaW5zLmNpc0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IjhScm51UGJDRFNCU0djbmkxY21HUWciLCJuYW1lIjoiS2llcmFuIENvbGxpbnMiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKekNVWXliVUt3S3JKQ3NwSVFDcXgzNlVtbGhxN0Vkd0thd0tJRFA9czk2LWMiLCJnaXZlbl9uYW1lIjoiS2llcmFuIiwiZmFtaWx5X25hbWUiOiJDb2xsaW5zIiwibG9jYWxlIjoiZW4iLCJpYXQiOjE2MzU3NzY3NTQsImV4cCI6MTYzNTc4MDM1NCwianRpIjoiMTIwMDNlZGE3NzAwMWY4MTk3YzU5NzJlYzQ3ZWE5NWM1MmM0MmQ4ZiJ9.p1ght2VSbcsviD6U7bDF8rB8x0to6I-jUzR4_OGxUv5tC3BUFaJuBX5N0U_qBvETNTvaDNVpI_LXf7wVKSl2Vf17GcFdueJ6Q8P5-WT89MJYtooOnEeqeDxtC0LTmZcdPFrx7e839ZZlsYN-nNYXyusr3Fu9kcK5uDV-SUF6AbYI-fQUV5rKb_9CdFaMyKrCpQtm_LFmtfnjmi3qAiO5csmTRgV8OABIuC7IbDIezwv5Bj95eRakyDSVFTidCTsU9G742dkZmAT91DpCZ0rQHjuE5pEmpn7C0jYcd-sqBsxkunrI-tMK6bROJa-0fhMmXcq9zOv63LuR4UPgNaoc4A",
  })
  @IsString()
  token: string;
}

export class googleLoginResponseDto {
  @ApiProperty({
    default: "21d132as1d32as1d3as1d3as1d3as1d3as1d3as13das",
  })
  accessToken: string;
}

export class googleLoginSuccessResponse {
  @ApiProperty({
    default: 200,
  })
  code: number;

  @ApiProperty({
    default: "signup_success",
  })
  message: string;

  @ApiProperty({
    required: false,
  })
  data: googleLoginResponseDto;
}

export class googleLoginErrorResponse {
  @ApiProperty({
    default: 400,
  })
  code: number;

  @ApiProperty()
  message: string;
}
