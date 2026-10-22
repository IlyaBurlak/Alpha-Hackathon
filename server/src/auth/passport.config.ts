import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { container } from '../container';
import { TYPES } from '../types';
// Предполагается, что у вас есть сервис пользователей
// import { IUserService } from '../user/user.service.interface';

const opts: any = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET, 
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload: any, done: any) => {
    try {
      // Здесь вы проверяете, существует ли пользователь с таким ID
      // const userService = container.get<IUserService>(TYPES.UserService);
      // const user = await userService.findById(jwt_payload.id);
      // 
        const user = (jwt_payload.id);
      
      // Для примера просто возвращаем payload
      if (jwt_payload) {
        return done(null, jwt_payload);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;