import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com', description: 'Registered email address' })
  @IsEmail()
  email: string;
}
