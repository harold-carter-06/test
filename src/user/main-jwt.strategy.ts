import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtPayload } from './jwt-payload.interface';
import { User } from './models/user.model';
import { UserService } from './user.service';
import { CommonSettings } from 'src/common-settings/common-settings.model';

@Injectable()
export class jwtStrategy extends PassportStrategy(
  Strategy,
  'main-jwt-strategy',
) {
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(
    payload: jwtPayload,
  ): Promise<{ user: User; commonSettings: CommonSettings }> {
    const { email } = payload;
    const { user, commonSettings } = await this.userService.findUserByEmail(
      email,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return { user, commonSettings };
  }
}
