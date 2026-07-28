import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'johndoe', description: 'Unique username' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  displayName: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'User password' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;
}
