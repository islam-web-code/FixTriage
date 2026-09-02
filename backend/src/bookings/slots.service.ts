import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns bookable slot times (ISO strings) for a service on a given date.
   * A slot is bookable if it falls inside the service's availability for that
   * weekday, is in the future, and the provider has no pending/accepted
   * booking at that exact time.
   */
  async getSlots(serviceId: number, dateStr: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { availability: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const date = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return { slots: [], reason: 'Invalid date' };
    }

    const dayOfWeek = date.getDay();
    const window = service.availability.find((a) => a.dayOfWeek === dayOfWeek);
    if (!window) {
      return { slots: [], reason: 'Not available on this day' };
    }

    // Build every candidate slot for the day
    const step = service.slotMinutes;
    const candidates: Date[] = [];
    for (
      let minutes = window.startHour * 60;
      minutes + step <= window.endHour * 60;
      minutes += step
    ) {
      const slot = new Date(date);
      slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      candidates.push(slot);
    }

    // Remove slots already taken by ANY booking of this provider that day
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const taken = await this.prisma.booking.findMany({
      where: {
        providerId: service.providerId,
        status: { in: ['pending', 'accepted'] },
        scheduledAt: { gte: dayStart, lt: dayEnd },
      },
      select: { scheduledAt: true },
    });
    const takenTimes = new Set(taken.map((b) => b.scheduledAt.getTime()));

    const now = Date.now();
    const slots = candidates
      .filter((s) => s.getTime() > now)
      .filter((s) => !takenTimes.has(s.getTime()))
      .map((s) => s.toISOString());

    return { slots, slotMinutes: step };
  }
}