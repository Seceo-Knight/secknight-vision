import { Injectable, ForbiddenException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JWTService {
    async verifyToken(token): Promise<any> {

        return jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) throw new ForbiddenException('Invalid token');

            return decoded;
        });
    }
}
