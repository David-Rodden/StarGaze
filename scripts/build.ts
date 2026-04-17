import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

type BundleTarget = {
    entrypoint: string;
    outputName: string;
};

const ROOT = process.cwd();
const DIST_DIR = join(ROOT, "dist");
const ASSET_DIR = join(DIST_DIR, "assets");
const BUNDLE_TARGETS: BundleTarget[] = [
    { entrypoint: "public/geolocate.js", outputName: "app.js" },
    { entrypoint: "public/stylesheet.css", outputName: "app.css" }
];
const STATIC_DIRS = ["dataset", "images"];

const resolveFromRoot = (path: string) => join(ROOT, path);
const toAssetPath = (filename: string) => `./assets/${filename}`;

const cleanDist = async () => {
    await rm(DIST_DIR, { recursive: true, force: true });
    await mkdir(ASSET_DIR, { recursive: true });
};

const bundleTarget = async ({ entrypoint, outputName }: BundleTarget) => {
    const result = await Bun.build({
        entrypoints: [resolveFromRoot(entrypoint)],
        outdir: ASSET_DIR,
        naming: outputName,
        minify: true,
        sourcemap: "linked",
        target: "browser"
    });

    if (!result.success) {
        result.logs.forEach((log) => console.error(log.message));
        throw new Error(`Bundle failed for ${entrypoint}`);
    }
};

const copyStatic = () => Promise.all(
    STATIC_DIRS.map((dir) => cp(resolveFromRoot(dir), join(DIST_DIR, dir), { recursive: true }))
);

const writeBundledIndex = async () => {
    const index = await readFile(resolveFromRoot("public/index.html"), "utf8");
    const bundledIndex = index
        .replace(/href="stylesheet\.css"/g, `href="${toAssetPath("app.css")}"`)
        .replace(/src="geolocate\.js" defer><\/script>/g, `src="${toAssetPath("app.js")}" defer></script>`);
    await writeFile(join(DIST_DIR, "index.html"), bundledIndex);
};

const main = async () => {
    await cleanDist();
    await Promise.all(BUNDLE_TARGETS.map(bundleTarget));
    await copyStatic();
    await writeBundledIndex();
    console.log("Build complete: dist/");
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
