import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Equipment } from 'pages/remotes';
import { formatDate } from 'pages/constants';

export interface BookingFilter {
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  equipment: Equipment[];
  preferredFloor: number | null;
}

function parseFilter(searchParams: URLSearchParams): BookingFilter {
  return {
    date: searchParams.get('date') || formatDate(new Date()),
    startTime: searchParams.get('startTime') || '',
    endTime: searchParams.get('endTime') || '',
    attendees: Number(searchParams.get('attendees')) || 1,
    equipment: searchParams.get('equipment')
      ? (searchParams.get('equipment')!.split(',').filter(Boolean) as Equipment[])
      : [],
    preferredFloor: searchParams.get('floor') ? Number(searchParams.get('floor')) : null,
  };
}

function toParams(filter: BookingFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter.date) params.date = filter.date;
  if (filter.startTime) params.startTime = filter.startTime;
  if (filter.endTime) params.endTime = filter.endTime;
  if (filter.attendees > 1) params.attendees = String(filter.attendees);
  if (filter.equipment.length > 0) params.equipment = filter.equipment.join(',');
  if (filter.preferredFloor !== null) params.floor = String(filter.preferredFloor);
  return params;
}

export function useBookingFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = parseFilter(searchParams);

  const updateFilter = useCallback(
    (partial: Partial<BookingFilter>) => {
      setSearchParams(prev => toParams({ ...parseFilter(prev), ...partial }), { replace: true });
    },
    [setSearchParams]
  );

  const hasTimeInputs = filter.startTime !== '' && filter.endTime !== '';
  let validationError: string | null = null;
  if (hasTimeInputs) {
    if (filter.endTime <= filter.startTime) {
      validationError = '종료 시간은 시작 시간보다 늦어야 합니다.';
    } else if (filter.attendees < 1) {
      validationError = '참석 인원은 1명 이상이어야 합니다.';
    }
  }
  const isFilterComplete = hasTimeInputs && !validationError;

  return { filter, updateFilter, validationError, isFilterComplete };
}
