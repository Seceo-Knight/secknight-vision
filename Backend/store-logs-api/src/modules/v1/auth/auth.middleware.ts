import { AuthService } from './utils/auth.service';
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../common/errlogger/logger';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly authService: AuthService) { }
    async use(req: Request, res: Response, next: NextFunction) {
        let token: string = req.headers.authorization;
        if (token && token.split(' ').length > 1) {
            token = token.split(' ')[1];
            // token = "a8b081d7d2dac0aa5e001cdfad23fc2b:9bb2caf0b1e03895e11e13cb9167a618e298d70e2b063d112bb823173be5bdc2a104c36ec418f304944431ed1ddab2297b3dad47890f9d4ef21a8dd0f2b6d3e96d6e91d53293177ba6c546ebb93345d83a57ff7190a38ad642a9751d4b88e380bd4e82ccfca61d11c4f0dbc350b9bed5b79e92cdb2aee95b8f3aedb32dac94198f427c85680e997343597f5a29cc629e677050165f043b1c111f30a959b64690c0c4c8d31e1d6200211cadb93261524cfcd7ee7df8b8913745186c11f6b39ac358b0cfef4c030c32f5299cd359038c3b5e22fe0413578764c3e611cbe23ea51419ace3d3c71614be765b5b3df34e1b51fecb35bd1245c0342a9a3bbe1be24e2216308a6fbb700b9a96e9950dd374d0fe41a3fe10621a7cbeffa85d805335c32d21444a354b93312023fa8ae4479fa108e3c170dfbaa87e03f1541f3450d56dca2cd8a461ba5298aa3532dacce0788cc4062d7c004445ea8de64ee5477beaac1669af1da552e31b10a06c419896032cb084cc16e8c1545f6c6c30081ba9910ff58f53866b40e93cd7c54a3e90ee38225d28c906505ba22ac531bf820db9e5c527747e163adaf26ab9829605d82284f13bd2a3dbc244ad0013ad96c189c9f93d7b3ec6375f4920dd79ee30044b84c66792676bfe11eec1a040f8cf8c23506b42074d8b89c269a8799637844cadccf30fa3c9e299f8227c9804d6398b1a3be29226cacec9c90018d47bd670162493174c7d9101bd05f63a62997385000404b5d76d8745d985649420f62af6025bb48bd6cfd9cd71af945b8bf61c6426ebcffa1eb2";
        } else {
            throw new ForbiddenException('Invalid token');
        }
        const m = await this.authService.verify(token);
        if (m && m.indexOf('user_id')) {
            req['user'] = JSON.parse(m);
            next();
        } else {
            throw new ForbiddenException('Invalid token');
        }
        // req['user'] = {
        //   email: 'f6489b9f-3540-419a-aa74-568c800a4486_@108130.OjUpRCP',
        //   employee_id: 210,
        //   organization_id: 1
        // };
        // next();
    }
}
