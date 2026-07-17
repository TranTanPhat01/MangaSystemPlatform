import React from 'react';
import { clsx } from 'clsx';
import { FileText, Inbox } from 'lucide-react';
import { SeriesProposalResponse, BoardVoteSummaryResponse } from '@/types/editorial';

function recStyle(rec: string | undefined) {
  if (rec === 'Recommended') return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
  if (rec === 'NeedsDiscussion') return 'text-amber-700 bg-amber-50 border border-amber-200';
  return 'text-red-700 bg-red-50 border border-red-200';
}

function statusStyle(status: string) {
  switch (status) {
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Voting': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Finalized': return 'bg-teal-50 text-teal-700 border-teal-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}

interface ProposalQueueProps {
  proposals: SeriesProposalResponse[];
  voteSummaries: Record<string, BoardVoteSummaryResponse>;
  onSelectProposal?: (p: SeriesProposalResponse) => void;
}

export default function ProposalQueue({ proposals, voteSummaries, onSelectProposal }: ProposalQueueProps) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-plum-50 flex items-center justify-center">
            <FileText size={15} className="text-plum-700" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Hàng chờ đề xuất series</h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {proposals.length} series đang chờ biểu quyết hội đồng
            </p>
          </div>
        </div>
        <button className="text-[10px] font-bold text-plum-700 hover:text-plum-900 px-3 py-1.5 rounded-lg hover:bg-plum-50 transition-colors">
          Xem tất cả
        </button>
      </div>

      {proposals.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <Inbox size={24} className="text-slate-300" />
          <p className="text-xs font-bold text-slate-600">Hàng chờ trống</p>
          <p className="text-[10px] text-slate-400 font-medium">Chưa có đề cử series nào gửi lên hội đồng.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/60 text-[9px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-100">
                <th className="px-5 py-3">Series / Mangaka</th>
                <th className="px-5 py-3">Thể loại</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3">Đề xuất BTV</th>
                <th className="px-5 py-3">Tiến độ bỏ phiếu</th>
                <th className="px-5 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {proposals.map((p) => {
                const summary = voteSummaries[p.id];
                const total = summary?.totalVotes ?? 0;
                const approve = summary?.approveCount ?? 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0 bg-indigo-500">
                          {p.seriesTitle?.slice(0, 2).toUpperCase() || 'MA'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{p.seriesTitle}</p>
                          <p className="text-[9px] font-medium text-slate-400">{p.mangakaName || 'Chưa rõ'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                        {p.genre || 'Manga'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded border', statusStyle(p.status))}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={clsx('text-[9px] font-bold px-2 py-1 rounded-lg border', recStyle(p.editorRecommendation))}>
                        {p.editorRecommendation || 'None'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-plum-600 to-plum-400"
                            style={{ width: total > 0 ? `${(approve / total) * 100}%` : '0%' }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600">{approve}/{total}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onSelectProposal?.(p)}
                        className="text-[10px] font-bold text-plum-700 bg-plum-50 border border-plum-100 px-3 py-1.5 rounded-lg hover:bg-plum-100 transition-colors group-hover:shadow-sm"
                      >
                        Xem xét
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
