import { Schema } from 'mongoose';

const UserSystemLogsSchema = new Schema(
  {
    title: { type: String, required: true, default: 'Passive' },
    type: { type: String, default: 'null' },
    employee_id: { type: Number, required: true },
    organization_id: { type: Number, required: true },
    computer: { type: String, required: true },
    duration: { type: Number, required: true },
    description: { type: String, default: 'null' },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    date: { type: String, required: true },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);

UserSystemLogsSchema.index(
  { organization_id: 1, employee_id: 1, date: 1 },
  { background: true },
);
UserSystemLogsSchema.index(
  { organization_id: 1, date: 1 },
  { background: true },
);
UserSystemLogsSchema.index({ employee_id: 1, date: 1 }, { background: true });

export { UserSystemLogsSchema };
