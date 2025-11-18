import './globals.css';

export const metadata = {
  title: 'Focus Clock',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel='manifest' href='/manifest.json'/>
        <meta name='theme-color' content='#000000' />
      </head>
      <body>{children}</body>

    </html>
  );
}