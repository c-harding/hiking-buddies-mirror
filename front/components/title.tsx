import Head from 'next/head';

import config from '../pages/config';

export default function Title({ page }: { page?: string }): JSX.Element {
  const site = config.titleSuffix;
  const renderedTitle = [page, site].filter(Boolean).join(' • ');
  return (
    <Head>
      <title>{renderedTitle}</title>
    </Head>
  );
}
