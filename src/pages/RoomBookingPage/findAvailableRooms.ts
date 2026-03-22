import type { Room, Reservation } from 'pages/remotes';
import type { BookingFilter } from './useBookingFilter';

export function findAvailableRooms(rooms: Room[], reservations: Reservation[], filter: BookingFilter): Room[] {
  return rooms
    .filter(room => {
      if (room.capacity < filter.attendees) return false;
      if (!filter.equipment.every(eq => room.equipment.includes(eq))) return false;
      if (filter.preferredFloor !== null && room.floor !== filter.preferredFloor) return false;
      const hasConflict = reservations.some(
        r => r.roomId === room.id && r.date === filter.date && r.start < filter.endTime && r.end > filter.startTime
      );
      return !hasConflict;
    })
    .sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.name.localeCompare(b.name);
    });
}

export function getAvailableFloors(rooms: Room[]): number[] {
  return [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);
}
