"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const load_env_1 = require("./load-env");
async function bootstrap() {
    (0, load_env_1.loadEnv)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'), { extensions: ['html'] });
    const rawOrigin = process.env.CORS_ORIGIN?.trim();
    const corsOrigin = !rawOrigin || rawOrigin === '*'
        ? true
        : rawOrigin.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({ origin: corsOrigin });
    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
//# sourceMappingURL=main.js.map