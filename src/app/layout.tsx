import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "College Pathway Explorer",
  description: "Find your perfect college path",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <span className="font-bold text-xl text-slate-800">CollegePath</span>
              </Link>

              {/* Navigation Links */}
              <nav className="flex items-center gap-6">
                <Link 
                  href="/" 
                  className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/search" 
                  className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
                >
                  Search
                </Link>
                <Link 
                  href="/compare" 
                  className="text-slate-600 hover:text-teal-600 font-medium transition-colors"
                >
                  Compare
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded gradient-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  </svg>
                </div>
                <span className="font-semibold text-white">CollegePath</span>
              </div>
              <p className="text-sm">© 2026 College Pathway Explorer. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
