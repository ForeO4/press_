import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const docSections = [
  {
    title: 'Getting Started',
    docs: [
      { name: 'Start Here', path: 'startup.md' },
      { name: 'Documentation Rules', path: 'DOCS_RULES.md' },
      { name: 'Changelog', path: 'CHANGELOG.md' },
    ],
  },
  {
    title: 'Overview',
    docs: [
      { name: 'Glossary', path: '00-overview/glossary.md' },
      { name: 'Vision', path: '00-overview/vision.md' },
      { name: 'Roadmap', path: '00-overview/roadmap.md' },
    ],
  },
  {
    title: 'Features',
    docs: [
      { name: 'Scoring', path: '05-features/scoring.md' },
      { name: 'Games', path: '05-features/games.md' },
      { name: 'Presses', path: '05-features/presses.md' },
      { name: 'Alligator Teeth', path: '05-features/alligator-teeth.md' },
      { name: 'Settlement', path: '05-features/settlement.md' },
      { name: 'Calcutta', path: '05-features/calcutta.md' },
    ],
  },
  {
    title: 'Technical',
    docs: [
      { name: 'Architecture', path: '02-architecture/tech-stack.md' },
      { name: 'Data Schema', path: '03-data/schema-overview.md' },
      { name: 'RLS Policies', path: '03-data/rls-policies.md' },
      { name: 'Security', path: '04-security/auth.md' },
    ],
  },
  {
    title: 'Development',
    docs: [
      { name: 'Local Setup', path: '09-dev/local-setup.md' },
      { name: 'Testing', path: '09-dev/testing.md' },
      { name: 'Conventions', path: '09-dev/conventions.md' },
    ],
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Press!
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">Documentation</h1>
        <p className="mb-8 text-muted-foreground">
          Press! documentation map. Source files are in <code>/docs/</code>.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {docSections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.docs.map((doc) => (
                    <li key={doc.path}>
                      <span className="text-sm">
                        {doc.name}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({doc.path})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Documentation is stored as Markdown files in
            the <code>/docs/</code> directory. View them directly in your code
            editor or on GitHub.
          </p>
        </div>
      </div>
    </main>
  );
}
