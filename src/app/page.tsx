import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthRedirectHandler } from '@/components/auth/AuthRedirectHandler';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-950">
      <AuthRedirectHandler />
      {/* Header */}
      <header className="container mx-auto flex items-center justify-between px-4 py-4">
        <span className="text-lg font-bold text-primary">Press!</span>
        <div className="flex items-center gap-4">
          <AuthHeader />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-bold text-primary">Press!</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Golf event games made fun with Gator Bucks
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/app">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Features</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Easy Scoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Mobile-first scorecard for tracking scores during your round.
                Real-time sync keeps everyone updated.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Built-in Games</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Match Play, Nassau, Skins - all your favorite golf games.
                Create presses mid-round with a single tap.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gator Bucks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fun currency for friendly competition. Track who owes what
                without real money complications.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* About Gator Bucks */}
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">What are Gator Bucks?</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-muted-foreground">
              Gator Bucks are Press!&apos;s fun currency for betting-style games.
              They&apos;re integers only, event-scoped, and have absolutely no cash value.
            </p>
            <p className="text-sm text-muted-foreground">
              Just bragging rights and good times with your golf buddies.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Press! - Golf event games made fun</p>
          <p className="mt-2">
            Gator Bucks are for fun and have no cash value.
          </p>
        </div>
      </footer>
    </main>
  );
}
