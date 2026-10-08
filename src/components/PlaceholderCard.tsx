import { Badge, Card } from './ui';

type PlaceholderCardProps = {
  readonly title: string;
  readonly description: string;
};

export function PlaceholderCard({ title, description }: PlaceholderCardProps) {
  return (
    <Card className="p-6">
      <Badge className="mb-2" variant="info">
        Foundation ready
      </Badge>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}
