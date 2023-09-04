import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import PostgresErrorCode from '../database/postgresErrorCode.enum';
import RegisterDto from './dto/register.dto';

@Injectable()
export class AuthenticationService {
  constructor(private usersService: UsersService) {}

  public async register(registrationData: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    try {
      const createdUser = await this.usersService.create({
        ...registrationData,
        password: hashedPassword,
      });
      createdUser.password = undefined;
      return createdUser;
    } catch (error) {
      if (error?.code === PostgresErrorCode.UniqueViolation) {
        throw new HttpException(
          'User with that email already existing',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Something went  wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getAuthenticatedUser(email: string, hashedPassword: string) {
    try {
      const user = await this.usersService.getByEmail(email);
      const isPasswordMatching = await bcrypt.compare(
        hashedPassword,
        user.password,
      );
      if (!isPasswordMatching) {
        throw new HttpException(
          'Wroong credentials provided',
          HttpStatus.BAD_REQUEST,
        );
      }
      user.password = undefined;
      return user;
    } catch (error) {
      throw new HttpException('Wrong credentials', HttpStatus.BAD_REQUEST);
    }
  }
}
