import { Html, Head, Main, NextScript } from 'next/document';

// Stub de Document para compatibilidad con dependencias que esperan pages/_document.js
// El proyecto usa App Router; cualquier personalización global debe ir en app/layout.tsx.
export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
