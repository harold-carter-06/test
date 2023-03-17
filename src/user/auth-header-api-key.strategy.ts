import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Strategy from 'passport-headerapikey';
import { User } from './models/user.model';
import { CommonSettings } from 'src/common-settings/common-settings.model';
import { UserService } from './user.service';

@Injectable()
export class HeaderApiKeyStrategy extends PassportStrategy(
  Strategy,
  'api-key-strategy',
) {
  constructor(private userService: UserService) {
    super({ header: 'X-API-KEY', prefix: '' }, true, async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  public validate = async (
    apiKey: string,
    done: (error: Error, data) => {},
  ) => {
    console.log('trying to validate api key');
    try {
      const { user, commonSettings } = await this.userService.findUserByAPIkey(
        apiKey,
      );
      console.log('done in validate');
      if (!user) {
        done(new UnauthorizedException(), null);
      }
      done(null, { user, commonSettings });
    } catch (err) {
      console.log(err);
      done(new UnauthorizedException(), null);
    }
  };
}
