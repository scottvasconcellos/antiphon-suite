import { type ReactNode } from "react";
import { Card, CardHeader } from "@antiphon/design-system/components";

type SectionCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <Card variant="raised" padding="default">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="section-content">{children}</div>
    </Card>
  );
}
