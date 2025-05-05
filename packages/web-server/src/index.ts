import express from "express";
import path from "path";
import fs from "fs-extra";

export async function startServer(workflowsDir: string) {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.static(path.resolve(__dirname, "../../web-ui/dist")));

  app.get("/api/workflows", async (_req, res) => {
    const files = await fs.readdir(workflowsDir);
    res.json(files.filter((f) => f.endsWith(".a4z.yaml")));
  });

  app.get("/api/workflows/:name", async (req, res) => {
    const file = path.join(workflowsDir, req.params.name);
    try {
      const content = await fs.readFile(file, "utf-8");
      res.type("text/plain").send(content);
    } catch {
      res.status(404).send("Not found");
    }
  });

  // TODO: POST, PUT, DELETE, RUN endpoints

  app.listen(PORT, () => {
    console.log(`🟢 UI disponible sur http://localhost:${PORT}`);
  });
}
