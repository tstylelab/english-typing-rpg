// Reminder UI state is local to this device/player, separate from learning data.
export const backupReminderKey = (playerId: string) => `etyping_backup_reminder:${playerId}`;

export function needsBackupReminder(playerId: string, date: string, answered: number): boolean {
  if (!playerId || answered <= 200) return false;
  try { return localStorage.getItem(backupReminderKey(playerId)) !== date; }
  catch { return true; }
}

export function acknowledgeBackupReminder(playerId: string, date: string): void {
  try { localStorage.setItem(backupReminderKey(playerId), date); }
  catch { /* A reminder must never block gameplay if browser storage is full. */ }
}
