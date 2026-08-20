import { Router } from "express";
import {
  createNote,
  getAllNotes,
  getNoteBySlug,
  updateNote,
} from "../controllers/notesController";

const router = Router();

router.post("/", createNote);
router.get("/", getAllNotes);
router.get("/:slug", getNoteBySlug);
router.patch("/:id", updateNote);

export default router;
