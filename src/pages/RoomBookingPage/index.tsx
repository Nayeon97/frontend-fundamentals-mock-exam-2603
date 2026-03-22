import { css } from '@emotion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Top, Spacing, Border, Button, Text, Select, ListRow } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getRooms, getReservations, createReservation } from 'pages/remotes';
import { EQUIPMENT_LABELS, ALL_EQUIPMENT, TIME_SLOTS, formatDate } from 'pages/constants';
import axios from 'axios';
import { useBookingFilter, type BookingFilter } from './useBookingFilter';

export function RoomBookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { filter, updateFilter, validationError, isFilterComplete } = useBookingFilter();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilterChange = (partial: Partial<BookingFilter>) => {
    updateFilter(partial);
    setSelectedRoomId(null);
    setErrorMessage(null);
  };

  const { data: rooms = [] } = useQuery(['rooms'], getRooms);
  const { data: reservations = [] } = useQuery(['reservations', filter.date], () => getReservations(filter.date), { enabled: !!filter.date });

  const createMutation = useMutation(createReservation, {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['reservations', variables.date]);
        queryClient.invalidateQueries(['myReservations']);
      },
    }
  );

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);

  const availableRooms = isFilterComplete
    ? rooms
        .filter(room => {
          if (room.capacity < filter.attendees) return false;
          if (!filter.equipment.every(eq => room.equipment.includes(eq))) return false;
          if (filter.preferredFloor !== null && room.floor !== filter.preferredFloor) return false;
          const hasConflict = reservations.some(
            r => r.roomId === room.id && r.date === filter.date && r.start < filter.endTime && r.end > filter.startTime
          );
          if (hasConflict) return false;
          return true;
        })
        .sort((a, b) => {
          if (a.floor !== b.floor) return a.floor - b.floor;
          return a.name.localeCompare(b.name);
        })
    : [];

  const handleBook = async () => {
    if (!selectedRoomId) {
      setErrorMessage('회의실을 선택해주세요.');
      return;
    }
    if (!filter.startTime || !filter.endTime) {
      setErrorMessage('시작 시간과 종료 시간을 선택해주세요.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        roomId: selectedRoomId,
        date: filter.date,
        start: filter.startTime,
        end: filter.endTime,
        attendees: filter.attendees,
        equipment: filter.equipment,
      });

      if ('ok' in result && result.ok) {
        navigate('/', { state: { message: '예약이 완료되었습니다!' } });
        return;
      }

      const errResult = result as { message?: string };
      setErrorMessage(errResult.message ?? '예약에 실패했습니다.');
      setSelectedRoomId(null);
    } catch (err: unknown) {
      let serverMessage = '예약에 실패했습니다.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        serverMessage = data?.message ?? serverMessage;
      }
      setErrorMessage(serverMessage);
      setSelectedRoomId(null);
    }
  };

  return (
    <div css={css`background: ${colors.white}; padding-bottom: 40px;`}>
      <div css={css`padding: 12px 24px 0;`}>
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="뒤로가기"
          css={css`
            background: none; border: none; padding: 0; cursor: pointer; font-size: 14px;
            color: ${colors.grey600}; &:hover { color: ${colors.grey900}; }
          `}
        >
          ← 예약 현황으로
        </button>
      </div>
      <Top.Top03 css={css`padding-left: 24px; padding-right: 24px;`}>
        예약하기
      </Top.Top03>

      {errorMessage && (
        <div css={css`padding: 0 24px;`}>
          <Spacing size={12} />
          <div
            css={css`
              padding: 10px 14px; border-radius: 10px; background: ${colors.red50};
              display: flex; align-items: center; gap: 8px;
            `}
          >
            <Text typography="t7" fontWeight="medium" color={colors.red500}>{errorMessage}</Text>
          </div>
        </div>
      )}

      <Spacing size={24} />

      {/* 예약 조건 입력 */}
      <div css={css`padding: 0 24px;`}>
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 조건
        </Text>
        <Spacing size={16} />

        {/* 날짜 */}
        <div css={css`display: flex; flex-direction: column; gap: 6px;`}>
          <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>날짜</Text>
          <input
            type="date"
            value={filter.date}
            min={formatDate(new Date())}
            onChange={e => handleFilterChange({ date: e.target.value })}
            aria-label="날짜"
            css={css`
              box-sizing: border-box; font-size: 16px; font-weight: 500; line-height: 1.5; height: 48px;
              background-color: ${colors.grey50}; border-radius: 12px; color: ${colors.grey800};
              width: 100%; border: 1px solid ${colors.grey200}; padding: 0 16px; outline: none;
              transition: border-color 0.15s; &:focus { border-color: ${colors.blue500}; }
            `}
          />
        </div>
        <Spacing size={14} />

        {/* 시간 */}
        <div css={css`display: flex; gap: 12px;`}>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>시작 시간</Text>
            <Select
              value={filter.startTime}
              onChange={e => handleFilterChange({ startTime: e.target.value })}
              aria-label="시작 시간"
            >
              <option value="">선택</option>
              {TIME_SLOTS.slice(0, -1).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>종료 시간</Text>
            <Select
              value={filter.endTime}
              onChange={e => handleFilterChange({ endTime: e.target.value })}
              aria-label="종료 시간"
            >
              <option value="">선택</option>
              {TIME_SLOTS.slice(1).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </div>
        <Spacing size={14} />

        {/* 참석 인원 + 선호 층 */}
        <div css={css`display: flex; gap: 12px;`}>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>참석 인원</Text>
            <input
              type="number"
              min={1}
              value={filter.attendees}
              onChange={e => handleFilterChange({ attendees: Math.max(1, Number(e.target.value)) })}
              aria-label="참석 인원"
              css={css`
                box-sizing: border-box; font-size: 16px; font-weight: 500; line-height: 1.5; height: 48px;
                background-color: ${colors.grey50}; border-radius: 12px; color: ${colors.grey800};
                width: 100%; border: 1px solid ${colors.grey200}; padding: 0 16px; outline: none;
                transition: border-color 0.15s; &:focus { border-color: ${colors.blue500}; }
              `}
            />
          </div>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>선호 층</Text>
            <Select
              value={filter.preferredFloor ?? ''}
              onChange={e => {
                const val = e.target.value;
                handleFilterChange({ preferredFloor: val === '' ? null : Number(val) });
              }}
              aria-label="선호 층"
            >
              <option value="">전체</option>
              {floors.map(f => (
                <option key={f} value={f}>{f}층</option>
              ))}
            </Select>
          </div>
        </div>
        <Spacing size={14} />

        {/* 장비 */}
        <div>
          <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>필요 장비</Text>
          <Spacing size={8} />
          <div css={css`display: flex; gap: 8px; flex-wrap: wrap;`}>
            {ALL_EQUIPMENT.map(eq => {
              const selected = filter.equipment.includes(eq);
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => {
                    const next = selected ? filter.equipment.filter(e => e !== eq) : [...filter.equipment, eq];
                    handleFilterChange({ equipment: next });
                  }}
                  aria-label={EQUIPMENT_LABELS[eq]}
                  aria-pressed={selected}
                  css={css`
                    padding: 8px 16px; border-radius: 20px;
                    border: 1px solid ${selected ? colors.blue500 : colors.grey200};
                    background: ${selected ? colors.blue50 : colors.grey50};
                    color: ${selected ? colors.blue600 : colors.grey700};
                    font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s;
                    &:hover { border-color: ${selected ? colors.blue500 : colors.grey400}; }
                  `}
                >
                  {EQUIPMENT_LABELS[eq]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {validationError && (
        <div css={css`padding: 0 24px;`}>
          <Spacing size={8} />
          <span css={css`color: ${colors.red500}; font-size: 14px;`} role="alert">{validationError}</span>
        </div>
      )}

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약 가능 회의실 목록 */}
      {isFilterComplete && (
        <div css={css`padding: 0 24px;`}>
          <div css={css`display: flex; align-items: baseline; gap: 6px;`}>
            <Text typography="t5" fontWeight="bold" color={colors.grey900}>
              예약 가능 회의실
            </Text>
            <Text typography="t7" fontWeight="medium" color={colors.grey500}>
              {availableRooms.length}개
            </Text>
          </div>
          <Spacing size={16} />

          {availableRooms.length === 0 ? (
            <div css={css`padding: 40px 0; text-align: center; background: ${colors.grey50}; border-radius: 14px;`}>
              <Text typography="t6" color={colors.grey500}>
                조건에 맞는 회의실이 없습니다.
              </Text>
            </div>
          ) : (
            <div css={css`display: flex; flex-direction: column; gap: 10px;`}>
              {availableRooms.map(room => {
                const isSelected = selectedRoomId === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={room.name}
                    css={css`
                      cursor: pointer; padding: 14px 16px; border-radius: 14px;
                      border: 2px solid ${isSelected ? colors.blue500 : colors.grey200};
                      background: ${isSelected ? colors.blue50 : colors.white};
                      transition: all 0.15s;
                      &:hover { border-color: ${isSelected ? colors.blue500 : colors.grey300}; }
                    `}
                  >
                    <ListRow
                      contents={
                        <ListRow.Text2Rows
                          top={room.name}
                          topProps={{ typography: 't6', fontWeight: 'bold', color: colors.grey900 }}
                          bottom={`${room.floor}층 · ${room.capacity}명 · ${room.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}`}
                          bottomProps={{ typography: 't7', color: colors.grey600 }}
                        />
                      }
                      right={
                        isSelected ? (
                          <Text typography="t7" fontWeight="bold" color={colors.blue500}>선택됨</Text>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          <Spacing size={16} />
          <Button display="full" onClick={handleBook} disabled={createMutation.isLoading}>
            {createMutation.isLoading ? '예약 중...' : '확정'}
          </Button>
        </div>
      )}

      <Spacing size={24} />
    </div>
  );
}
