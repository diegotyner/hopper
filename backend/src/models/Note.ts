import mongoose, { Schema, Document } from "mongoose";
import slugify from "slugify";

// timestamps provides update time, date provides creations
const Stored = "Stored";
const InProgress = "In Progress";
const Reviewed = "Reviewed";
const Done = "Done";
const noteStatuses = [Stored, InProgress, Reviewed, Done];
export interface INote extends Document {
  title: string;
  slug: string;
  date: Date;
  comments: string;
  status: string;
  isGem: boolean;
  isArchived: boolean;
  priority: string;
}
const noteSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    comments: String, // personal self note on WHY i want to save this
    status: {
      type: String,
      enum: noteStatuses,
      default: "Stored",
    },
    isGem: Boolean,
    isArchived: Boolean,
    priority: { type: String, enum: ["Low", "Medium", "High", "ASAP"] },
  },
  { timestamps: true },
);

const validTransitions = new Map<string, Array<string | null>>([
  [Stored, [InProgress, Reviewed, Done]],
  [InProgress, [Reviewed, Done]],
  [Reviewed, [Done]],
  [Done, []],
]);

// Middleware, reject bad updates at mongoose level
noteSchema.pre("save", function () {
  // Ensure valid state
  if (!validTransitions.has(this.status)) {
    throw new Error("[Note pre-save hook]: Invalid note status");
  }
});

noteSchema.pre("save", async function () {
  // Generate slug for URL
  const delimeter = "-";
  let base_slug = slugify(this.title, {
    replacement: delimeter,
    remove: /[*+~.()'"!:@]/g,
  });
  if (base_slug.length > 20) {
    base_slug = base_slug.substring(0, 20);
  }

  let suffix = 0;
  let potential = base_slug;
  while (true) {
    if (suffix != 0) {
      potential = base_slug + delimeter + String(suffix);
    }
    const existingNote = await Note.findOne({ slug: potential });
    if (!existingNote) {
      this.slug = potential;
      break;
    }
    suffix += 1;
  }
});

function extractFieldFromUpdate<K extends keyof INote>(
  update: mongoose.UpdateQuery<INote> | null,
  field: K,
): INote[K] | undefined {
  if (!update) return undefined;
  if (Array.isArray(update)) {
    throw new Error(
      `[Note pre-update hook]: Aggregation pipeline updates are not supported for field "${String(field)}"`,
    );
  }
  if (field in update && update[field] !== undefined) {
    return update[field] as INote[K];
  }
  if (update.$set && field in update.$set && update.$set[field] !== undefined) {
    return update.$set[field] as INote[K];
  }
  return undefined;
}
noteSchema.pre("findOneAndUpdate", async function () {
  // Validate unarchived and valid state transition
  // Combined into 1 route to save on DB fetches
  const update = this.getUpdate();
  if (!update) return;

  // old value needs to be fetched to inspect if its archived
  const prevValue = await this.model.findOne(this.getFilter());
  if (!prevValue) {
    throw new Error(
      "[Note pre-update hook]: Bad filter, no satisfying note found",
    );
  }

  const newArchiveStatus = extractFieldFromUpdate(update, "isArchived");
  if (prevValue.isArchived && newArchiveStatus != false) {
    throw new Error(
      "[Note pre-update hook]: Note is archived and archival status not modified, no editing is valid",
    );
  }

  const newStatus = extractFieldFromUpdate(update, "status");
  if (newStatus === undefined) {
    return;
  }

  // Else, status is editted. Verify that its valid.
  const potentialTransitions = validTransitions.get(prevValue.status);
  if (
    !(prevValue.status === newStatus) &&
    !potentialTransitions?.includes(newStatus)
  ) {
    throw new Error("[Note pre-update hook]: Invalid note update");
  }
});

export const Note = mongoose.model<INote>("Note", noteSchema);

// Only ever going to be YT vids
const videoNoteSchema = new Schema({
  url: { type: String, required: true },
  thumbnailUrlBase: { type: String, required: true },
});
export const VideoNote = Note.discriminator("VideoNote", videoNoteSchema);

const articleNoteSchema = new Schema({
  url: { type: String, required: true },
});
export const ArticleNote = Note.discriminator("ArticleNote", articleNoteSchema);

const blurtNoteSchema = new Schema({
  blurt: { type: String, required: true },
});
export const BlurtNote = Note.discriminator("BlurtNote", blurtNoteSchema);
