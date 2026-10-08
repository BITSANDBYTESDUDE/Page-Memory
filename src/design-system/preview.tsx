import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Dropdown,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingState,
  Modal,
  ProgressBar,
  SearchInput,
} from '../components/ui';

export function DesignSystemPreview() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('recent');

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white"
              >
                P
              </span>
              <span className="text-sm font-semibold text-indigo-700">PageMemory</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Design system</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              A compact, accessible component library for the PageMemory extension.
              Components use consistent spacing, visible keyboard focus, and reduced-motion
              support.
            </p>
          </div>
          <Badge variant="success">Day 11 · UI foundations</Badge>
        </header>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <SectionHeading title="Buttons" description="Actions and icon-only controls" />
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Delete</Button>
              <Button size="sm" variant="secondary">
                Compact
              </Button>
              <Button disabled>Disabled</Button>
              <IconButton aria-label="Add page">
                <span aria-hidden="true" className="text-lg leading-none">
                  +
                </span>
              </IconButton>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Badges & progress" description="Status at a glance" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Unread</Badge>
              <Badge variant="info">Reading</Badge>
              <Badge variant="success">Saved</Badge>
              <Badge variant="warning">Paused</Badge>
              <Badge variant="danger">Failed</Badge>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-slate-600">
                <span>Reading progress</span>
                <span>68%</span>
              </div>
              <ProgressBar label="Reading progress" value={68} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Form controls" description="Labels and descriptions stay connected" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                autoComplete="off"
                description="Shown only to you."
                label="Page title"
                placeholder="Add a short title"
              />
              <Dropdown
                label="Sort pages"
                onChange={(event) => setSortOrder(event.target.value)}
                options={[
                  { value: 'recent', label: 'Recently read' },
                  { value: 'title', label: 'Title A to Z' },
                  { value: 'domain', label: 'Website' },
                ]}
                value={sortOrder}
              />
              <div className="sm:col-span-2">
                <SearchInput
                  label="Search your library"
                  onChange={(event) => setSearch(event.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Search saved pages"
                  value={search}
                />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Feedback states" description="Clear feedback without heavy motion" />
            <div className="mt-4 grid gap-3">
              <LoadingState label="Loading your pages…" />
              <ErrorState
                message="Your library couldn't be loaded. Check your connection and try again."
                title="Unable to load pages"
              />
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Empty state" description="A helpful next step when there is no content" />
            <div className="mt-4">
              <EmptyState
                action={<Button size="sm">Save this page</Button>}
                description="Saved pages will appear here so you can pick up where you left off."
                title="Your library is empty"
              />
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Modal" description="Keyboard-dismissable dialog with focus management" />
            <p className="mt-3 text-sm text-slate-600">
              Open the dialog, then use Tab, Shift+Tab, or Escape.
            </p>
            <Button className="mt-4" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </Card>
        </div>
      </div>

      <Modal onClose={() => setModalOpen(false)} open={modalOpen} title="Page details">
        <p>
          This is a reusable modal primitive. It closes with Escape or by activating the close
          button, keeps keyboard focus inside, and returns focus to the opener.
        </p>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setModalOpen(false)} size="sm" variant="secondary">
            Done
          </Button>
        </div>
      </Modal>
    </main>
  );
}

interface SectionHeadingProps {
  readonly title: string;
  readonly description: string;
}

function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
