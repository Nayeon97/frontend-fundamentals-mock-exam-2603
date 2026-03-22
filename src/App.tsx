import normalize from 'emotion-normalize';
import { css, Global } from '@emotion/react';
import { Component, Suspense, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalPortal } from './GlobalPortal';
import { Spacing, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';

import '_tosslib/sass/app.scss';
import { PageLayout } from 'pages/PageLayout';
import { Routes } from 'pages/Routes';

class QueryErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('QueryErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div css={css`display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; padding: 24px;`}>
          <Spacing size={40} />
          <Text typography="t6" color={colors.red500}>데이터를 불러오지 못했습니다.</Text>
          <Spacing size={12} />
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            css={css`
              padding: 8px 20px; border-radius: 8px; border: 1px solid ${colors.grey300};
              background: ${colors.white}; color: ${colors.grey800}; font-size: 14px;
              cursor: pointer; &:hover { background: ${colors.grey50}; }
            `}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoadingFallback() {
  return (
    <div css={css`display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;`}>
      <Spacing size={40} />
      <Text typography="t6" color={colors.grey500}>불러오는 중...</Text>
    </div>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            suspense: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalPortal.Provider>
        <Global
          styles={css`
            ${normalize}
            h1, h2, h3, h4, h5, h6 {
              font-size: 1em;
              font-weight: normal;
              margin: 0; /* or '0 0 1em' if you're so inclined */
            }
          `}
        />
        <PageLayout>
          <QueryErrorBoundary>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes />
            </Suspense>
          </QueryErrorBoundary>
        </PageLayout>
      </GlobalPortal.Provider>
    </QueryClientProvider>
  );
}
