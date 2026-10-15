import './globals.css';
import { Providers } from '../components/providers';
export const metadata = { title:'IJA Enterprise Performance Management', description:'IJA Developer integrated planning and management platform' };
export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
