import type { AppProps } from 'next/app';

// Stub _app para satisfacer el Pages Router cuando existe _document.
// No se usa realmente porque la app corre principalmente en App Router (carpeta app/).
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
