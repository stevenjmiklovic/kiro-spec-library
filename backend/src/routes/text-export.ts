import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import { buildTextExportZip, applyTextExportZip } from "../services/text-export.js";
import { recordEvent } from "../services/audit.js";

export function textExportRoutes(deps: { db: Database }) {
  const { db } = deps;

  return new Elysia({ prefix: "" })
    .get("/export/text", () => {
      const zip = buildTextExportZip(db);
      recordEvent(db, "text_export_created");

      const filename = `spec-library-export-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
      return new Response(zip, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    })
    .post("/export/text/apply", async ({ request, set }) => {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        set.status = 400;
        return { code: "INVALID_REQUEST", message: "Expected multipart/form-data body." };
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        set.status = 400;
        return { code: "FILE_REQUIRED", message: "No export archive was uploaded." };
      }

      const zipBytes = new Uint8Array(await file.arrayBuffer());

      let result;
      try {
        result = applyTextExportZip(db, zipBytes);
      } catch (err) {
        set.status = 400;
        return {
          code: "INVALID_EXPORT_FILE",
          message: err instanceof Error ? err.message : "Uploaded file could not be read as a text export archive.",
        };
      }

      recordEvent(db, "text_export_applied");
      return result;
    });
}
