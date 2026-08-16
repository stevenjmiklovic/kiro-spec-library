import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";
import { createBackupBuffer, restoreFromBackup, InvalidBackupError } from "../services/backup.js";
import { recordEvent } from "../services/audit.js";

const RESTORE_CONFIRMATION = "RESTORE";

export function backupRoutes(deps: { db: Database; dataDir: string }) {
  const { db, dataDir } = deps;

  return new Elysia({ prefix: "" })
    .get("/backup", () => {
      const bytes = createBackupBuffer(db);
      recordEvent(db, "backup_created");

      const filename = `spec-library-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.db`;
      return new Response(bytes, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    })
    .post("/backup/restore", async ({ request, set }) => {
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch {
        set.status = 400;
        return { code: "INVALID_REQUEST", message: "Expected multipart/form-data body." };
      }

      const confirmation = formData.get("confirmation");
      if (confirmation !== RESTORE_CONFIRMATION) {
        set.status = 400;
        return {
          code: "CONFIRMATION_REQUIRED",
          message: `Restoring a backup replaces the entire library. Set "confirmation" to exactly "${RESTORE_CONFIRMATION}" to proceed.`,
        };
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
        set.status = 400;
        return { code: "FILE_REQUIRED", message: "No backup file was uploaded." };
      }

      const uploaded = new Uint8Array(await file.arrayBuffer());

      try {
        const { safetyBackupPath } = await restoreFromBackup(db, dataDir, uploaded);
        recordEvent(db, "backup_restored");

        return {
          restored: true,
          requiresRestart: true,
          message: "Backup restored to disk. Restart the Spec Library backend for the restored data to take effect.",
          safetyBackupPath,
        };
      } catch (err) {
        if (err instanceof InvalidBackupError) {
          set.status = 400;
          return { code: err.code, message: err.message };
        }
        throw err;
      }
    });
}
