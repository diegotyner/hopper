import { Request, Response } from "express";
import { Note } from "../models/Note";

export async function createNote(req: Request, res: Response): Promise<void> {
  const note = await Note.create(req.body);
  res.status(201).json(note);
}

export async function getAllNotes(_req: Request, res: Response): Promise<void> {
  const notes = await Note.find();
  res.json(notes);
}

export async function getNoteBySlug(req: Request, res: Response): Promise<void> {
  const note = await Note.findOne({ slug: req.params.slug });
  if (!note) {
    res.status(404).json({ error: { message: "Note not found" } });
    return;
  }
  res.json(note);
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  const note = await Note.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!note) {
    res.status(404).json({ error: { message: "Note not found" } });
    return;
  }
  res.json(note);
}
