import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE_ORM, DrizzleDB } from '../drizzle/drizzle.module';
import { dailySlots, stores } from '@spinzo/db';
import { eq, and } from 'drizzle-orm';

// The fixed daily pickup time slots Spinzo offers
// These are auto-created on demand if they don't exist yet.
const DEFAULT_SLOTS = [
  '07:00-08:00',
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
  '19:00-20:00',
];

const DEFAULT_MAX_CAPACITY = 5;

@Injectable()
export class SlotsService {
  constructor(@Inject(DRIZZLE_ORM) private db: DrizzleDB) {}

  /**
   * Get slot availability for a date and store.
   * Auto-provisions slots for the date if they don't yet exist.
   * This is the scalable multi-store pattern: each store has its own slot capacity.
   */
  async getAvailability(storeId: string, date: string) {
    // Check store exists
    const [store] = await this.db
      .select()
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.isActive, true)));

    if (!store) {
      return { storeId, date, slots: [], error: 'Store not found or inactive' };
    }

    // Fetch or auto-create slots
    const existingSlots = await this.db
      .select()
      .from(dailySlots)
      .where(and(eq(dailySlots.storeId, storeId), eq(dailySlots.slotDate, date)));

    if (existingSlots.length === 0) {
      // Auto-provision slots for this date/store
      const slotValues = DEFAULT_SLOTS.map((slotTime) => ({
        storeId,
        slotDate: date,
        slotTime,
        bookedCount: 0,
        maxCapacity: DEFAULT_MAX_CAPACITY,
      }));

      await this.db.insert(dailySlots).values(slotValues).onConflictDoNothing();

      const newSlots = await this.db
        .select()
        .from(dailySlots)
        .where(and(eq(dailySlots.storeId, storeId), eq(dailySlots.slotDate, date)));

      return this.formatSlots(storeId, date, newSlots);
    }

    return this.formatSlots(storeId, date, existingSlots);
  }

  /**
   * Atomically increment slot booked count.
   * Called inside a transaction from OrdersService.
   * Returns false if at capacity.
   */
  async reserveSlot(
    tx: any,
    storeId: string,
    date: string,
    slotTime: string,
  ): Promise<boolean> {
    const [slot] = await tx
      .select()
      .from(dailySlots)
      .where(
        and(
          eq(dailySlots.storeId, storeId),
          eq(dailySlots.slotDate, date),
          eq(dailySlots.slotTime, slotTime),
        ),
      );

    if (!slot) {
      // Auto-create if missing (e.g. first booking for this date/time)
      await tx.insert(dailySlots).values({
        storeId,
        slotDate: date,
        slotTime,
        bookedCount: 1,
        maxCapacity: DEFAULT_MAX_CAPACITY,
      });
      return true;
    }

    if (slot.bookedCount >= slot.maxCapacity) {
      return false; // Full
    }

    await tx
      .update(dailySlots)
      .set({ bookedCount: slot.bookedCount + 1 })
      .where(eq(dailySlots.id, slot.id));

    return true;
  }

  /**
   * Release a slot (used on order cancellation).
   */
  async releaseSlot(storeId: string, date: string, slotTime: string) {
    const [slot] = await this.db
      .select()
      .from(dailySlots)
      .where(
        and(
          eq(dailySlots.storeId, storeId),
          eq(dailySlots.slotDate, date),
          eq(dailySlots.slotTime, slotTime),
        ),
      );

    if (slot && slot.bookedCount > 0) {
      await this.db
        .update(dailySlots)
        .set({ bookedCount: slot.bookedCount - 1 })
        .where(eq(dailySlots.id, slot.id));
    }
  }

  private formatSlots(storeId: string, date: string, slots: any[]) {
    return {
      storeId,
      date,
      slots: slots.map((s) => ({
        id: s.id,
        slotTime: s.slotTime,
        available: s.bookedCount < s.maxCapacity,
        remaining: Math.max(0, s.maxCapacity - s.bookedCount),
        maxCapacity: s.maxCapacity,
        bookedCount: s.bookedCount,
      })),
    };
  }
}
