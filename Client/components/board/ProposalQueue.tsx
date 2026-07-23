import { SeriesResponse } from '@/types/manga';
import { BoardVoteSummaryResponse } from '@/types/editorial';

interface Props {
  proposals: SeriesResponse[];
  voteSummaries: Record<string, BoardVoteSummaryResponse>;
  onSelectProposal?: (series: SeriesResponse) => void;
}

export default function ProposalQueue({ proposals, voteSummaries, onSelectProposal }: Props) {
  return (
    <section className="bg-white border rounded-xl p-4">
      <h2 className="font-bold">Series</h2>
      {proposals.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có Series.</p>
      ) : (
        proposals.map((series) => (
          <button
            key={series.id}
            onClick={() => onSelectProposal?.(series)}
            className="block w-full text-left p-2 border-b"
          >
            <span>{series.title}</span>
            <span className="ml-2 text-xs">Votes: {voteSummaries[series.id]?.total ?? 0}</span>
          </button>
        ))
      )}
    </section>
  );
}
