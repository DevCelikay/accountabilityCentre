import Dexie, { Table } from 'dexie';
import { Client, Task, Behavior, BehaviorRecord, NotificationSchedule, DailyReview } from '../types';

export class AccountabilityDB extends Dexie {
  clients!: Table<Client>;
  tasks!: Table<Task>;
  behaviors!: Table<Behavior>;
  behaviorRecords!: Table<BehaviorRecord>;
  notifications!: Table<NotificationSchedule>;
  dailyReviews!: Table<DailyReview>;

  constructor() {
    super('AccountabilityCentre');

    this.version(1).stores({
      clients: 'id, name, isArchived, createdAt',
      tasks: 'id, clientId, status, priority, dueDate, createdAt, completedAt',
      behaviors: 'id, name, type, isActive, createdAt',
      behaviorRecords: 'id, behaviorId, timestamp, type',
      notifications: 'id, type, entityId, isEnabled',
      dailyReviews: 'id, date, type',
    });
  }
}

export const db = new AccountabilityDB();
