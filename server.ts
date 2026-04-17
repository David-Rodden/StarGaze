import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const DIST_DIR = join(process.cwd(), "dist");
const PORT = Number(process.env.PORT ?? 8000);

const MIME_TYPES = new Map<string, string>([
    [".html", "text/html; charset=utf-8"],
    [".js", "text/javascript; charset=utf-8"],
    [".css", "text/css; charset=utf-8"],
    [".json", "application/json; charset=utf-8"],
    [".txt", "text/plain; charset=utf-8"],
    [".png", "image/png"],
    [".jpg", "image/jpeg"],
    [".jpeg", "image/jpeg"],
    [".ico", "image/x-icon"],
    [".map", "application/json; charset=utf-8"]
]);

const toRequestPath = (url: URL) => normalize(url.pathname === "/" ? "/index.html" : url.pathname);
const withinDist = (filePath: string) => filePath.startsWith(DIST_DIR);
const cacheControlFor = (extension: string) => extension === ".html" ? "no-cache" : "public, max-age=31536000, immutable";

const createNotFound = () => new Response("Not found", { status: 404 });

if (!existsSync(DIST_DIR)) {
    console.error("Missing dist/ directory. Run `bun run build` first.");
    process.exit(1);
}

const server = Bun.serve({
    port: PORT,
    async fetch(req) {
        const filePath = join(DIST_DIR, toRequestPath(new URL(req.url)));
        if (!withinDist(filePath)) {
            return createNotFound();
        }

        const file = Bun.file(filePath);
        if (!(await file.exists())) {
            return createNotFound();
        }

        const extension = extname(filePath);
        return new Response(file, {
            headers: {
                "content-type": MIME_TYPES.get(extension) ?? "application/octet-stream",
                "cache-control": cacheControlFor(extension)
            }
        });
    }
});

console.log(`StarGaze running at http://localhost:${server.port}`);
