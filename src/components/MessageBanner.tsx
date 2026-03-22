import { css } from '@emotion/react';
import { Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';

export function MessageBanner({ type, text }: { type: 'success' | 'error'; text: string }) {
  const isSuccess = type === 'success';
  return (
    <div css={css`padding: 0 24px;`}>
      <div
        css={css`
          padding: 10px 14px; border-radius: 10px;
          background: ${isSuccess ? colors.blue50 : colors.red50};
          display: flex; align-items: center; gap: 8px;
        `}
      >
        <Text typography="t7" fontWeight="medium" color={isSuccess ? colors.blue600 : colors.red500}>{text}</Text>
      </div>
    </div>
  );
}
