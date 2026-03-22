import { http } from 'pages/http';
import type { Room, Reservation, Equipment } from '_tosslib/server/types';

export type { Room, Reservation, Equipment };

export function getRooms() {
  return http.get<Room[]>('/api/rooms');
}

export function getReservations(date: string) {
  return http.get<Reservation[]>(`/api/reservations?date=${date}`);
}

export function createReservation(data: {
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: Equipment[];
}) {
  return http.post<typeof data, { ok: boolean; reservation?: Reservation; code?: string; message?: string }>(
    '/api/reservations',
    data
  );
}

export function getMyReservations() {
  return http.get<Reservation[]>('/api/my-reservations');
}

export function cancelReservation(id: string) {
  return http.delete<{ ok: boolean }>(`/api/reservations/${id}`);
}
