import { Router } from "express";
import { readFile } from "node:fs/promises";

const router = Router();
const file = new URL("../data/profile.json", import.meta.url);

router.get("/", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=60");
    res.json(JSON.parse(await readFile(file, "utf8")));
  } catch (e) {
    next(e);
  }
});

export default router;
