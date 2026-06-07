"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
function createPrisma() {
    const connectionString = process.env.DATABASE_URL;
    const adapter = new adapter_pg_1.PrismaPg({ connectionString });
    return new client_1.PrismaClient({ adapter });
}
async function main() {
    const prisma = createPrisma();
    try {
        console.log('Nothing to seed — car catalogue moved to AI-generated recommendations.');
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map