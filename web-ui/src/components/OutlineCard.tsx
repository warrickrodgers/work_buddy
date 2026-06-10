import { useNavigate } from 'react-router-dom';
import { BookOpen, Layers, LayoutList, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface OutlineCardProps {
  outlineId: number;
  challengeId: number;
  title: string;
  phaseCount: number;
  itemCount: number;
}

export function OutlineCard({ outlineId, challengeId, title, phaseCount, itemCount }: OutlineCardProps) {
  const navigate = useNavigate();

  return (
    <div className="nm-raised rounded-2xl px-5 py-4 bg-background max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Solution Outline</p>
          <h3 className="font-semibold text-foreground text-sm leading-snug">{title}</h3>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="w-3.5 h-3.5" />
              {phaseCount} {phaseCount === 1 ? 'phase' : 'phases'}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutList className="w-3.5 h-3.5" />
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          className="gap-1.5 text-xs h-8 rounded-xl"
          onClick={() => navigate(`/dashboard/challenges/${challengeId}/outlines/${outlineId}`)}
        >
          View Outline
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
