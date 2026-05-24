/**
 * Adds string `id` (uuid) unique index alongside MongoDB _id.
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * @param {import('mongoose').Schema} schema
 */
export function publicIdPlugin(schema) {
  schema.add({
    id: { type: String, unique: true, index: true },
  });

  schema.pre('save', function preSave() {
    if (!this.id) {
      this.id = uuidv4();
    }
  });
}
