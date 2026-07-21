import { NestInterceptor, ExecutionContext, CallHandler, Injectable } from "@nestjs/common";
import { tap } from "rxjs/operators";

@Injectable()
export class ExecutionTimeInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const now: number = Date.now();
        const requestedApiUrl: string = context.getArgs()[1].req.originalUrl;
        return next.handle().pipe(
            tap(() => {
                return console.log(`${requestedApiUrl} - took ---> ${Date.now() - now} ms to complete.`);
            })
        )
    }
}