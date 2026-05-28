export const dynamic = 'force-dynamic';

import { CallbackClient } from './CallbackClient';

export default function CallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; token?: string; error?: string; error_code?: string; error_description?: string };
}) {
  return (
    <CallbackClient
      code={searchParams.code ?? null}
      token={searchParams.token ?? null}
      error={searchParams.error ?? null}
      errorCode={searchParams.error_code ?? null}
      errorDescription={searchParams.error_description ?? null}
    />
  );
}
