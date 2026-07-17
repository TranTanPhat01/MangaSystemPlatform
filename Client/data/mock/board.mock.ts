import { SeriesProposal, VotingCard, RankingRow, CancellationCard, ScheduleItem, DecisionItem } from '@/types/board';

export const PROPOSALS: SeriesProposal[] = [
  { id: 'p1', title: 'Blue Moon', mangaka: 'Akira Sato', genre: 'Action/Fantasy', submitted: '15/06/2026', editorRec: 'Recommended', votes: 3, totalVotes: 5, color: 'bg-indigo-500' },
  { id: 'p2', title: 'Crimson Days', mangaka: 'Yui Mori', genre: 'Drama', submitted: '14/06/2026', editorRec: 'Needs Discussion', votes: 2, totalVotes: 5, color: 'bg-rose-500' },
  { id: 'p3', title: 'Silent Rain', mangaka: 'Kenji Ito', genre: 'Mystery', submitted: '12/06/2026', editorRec: 'Recommended', votes: 4, totalVotes: 5, color: 'bg-teal-500' },
  { id: 'p4', title: 'Iron Virtue', mangaka: 'Hana Noda', genre: 'Historical', submitted: '10/06/2026', editorRec: 'Not Recommended', votes: 1, totalVotes: 5, color: 'bg-amber-500' },
];

export const VOTING_CARDS: VotingCard[] = [
  { id: 'v1', title: 'Blue Moon', mangaka: 'Akira Sato', genre: 'Action / Fantasy', editorRec: 'Strongly Recommended', recColor: 'text-emerald-700 bg-emerald-50 border-emerald-200', votes: 3, totalVotes: 5, synopsis: 'A warrior awakens in a world where the moon never sets, blending sword-action and high-concept fantasy in sharp, kinetic panels.', cover: 'bg-gradient-to-br from-indigo-600 to-blue-800', pubType: 'Weekly' },
  { id: 'v2', title: 'Crimson Days', mangaka: 'Yui Mori', genre: 'Slice-of-Life / Drama', editorRec: 'Needs Discussion', recColor: 'text-amber-700 bg-amber-50 border-amber-200', votes: 2, totalVotes: 5, synopsis: 'An intimate portrait of five art-school friends across one summer that doubles as a love letter to creative struggle.', cover: 'bg-gradient-to-br from-rose-600 to-pink-800', pubType: 'Monthly' },
];

export const RANKINGS: RankingRow[] = [
  { rank: 1, prevRank: 1, title: 'Blue Moon', votes: 9841, positivePct: 97, riskLevel: 'Low', genre: 'Action/Fantasy' },
  { rank: 2, prevRank: 3, title: 'Kaze no Tsubasa', votes: 8124, positivePct: 94, riskLevel: 'Low', genre: 'Adventure' },
  { rank: 3, prevRank: 2, title: 'Re:Birth', votes: 7502, positivePct: 92, riskLevel: 'Low', genre: 'Sci-Fi' },
  { rank: 7, prevRank: 5, title: 'Silent Wind', votes: 5200, positivePct: 85, riskLevel: 'Medium', genre: 'Drama' },
  { rank: 11, prevRank: 8, title: 'Twilight Hunt', votes: 3890, positivePct: 78, riskLevel: 'Medium', genre: 'Mystery' },
  { rank: 18, prevRank: 13, title: 'Crimson Days', votes: 2100, positivePct: 62, riskLevel: 'High', genre: 'Drama' },
  { rank: 19, prevRank: 17, title: 'Black Lotus', votes: 1950, positivePct: 60, riskLevel: 'High', genre: 'Thriller' },
  { rank: 21, prevRank: 18, title: 'Silent Rain', votes: 1500, positivePct: 54, riskLevel: 'Critical', genre: 'Mystery' },
];

export const CANCELLATION_CARDS: CancellationCard[] = [
  { id: 'c1', title: 'Crimson Days', rank: 18, lowRankCount: 3, editorNote: 'Writer has revised pacing plan; Chapter 25 shows significant momentum uptick.', riskLevel: 'Medium', genre: 'Drama' },
  { id: 'c2', title: 'Silent Rain', rank: 21, lowRankCount: 4, editorNote: 'Structural arc issues remain unresolved. Readership decline is consistent.', riskLevel: 'High', genre: 'Mystery' },
  { id: 'c3', title: 'Black Lotus', rank: 19, lowRankCount: 2, editorNote: 'Schedule change to monthly may stabilise quality and reader retention.', riskLevel: 'Medium', genre: 'Thriller' },
];

export const SCHEDULE: ScheduleItem[] = [
  { title: 'Blue Moon', chapter: 'Chapter 13', type: 'Weekly', date: '17/06/2026' },
  { title: 'Kaze no Tsubasa', chapter: 'Chapter 09', type: 'Monthly', date: '20/06/2026' },
  { title: 'Re:Birth', chapter: 'Chapter 04', type: 'Weekly', date: '22/06/2026' },
  { title: 'Twilight Hunt', chapter: 'Chapter 07', type: 'Monthly', date: '25/06/2026' },
];

export const DECISIONS: DecisionItem[] = [
  { action: 'Approved serialization', series: 'Blue Moon', time: '2h ago', type: 'approve', by: 'Board (5/5)' },
  { action: 'Changed to monthly', series: 'Crimson Days', time: '5h ago', type: 'change', by: 'Board (4/5)' },
  { action: 'Requested revision', series: 'Silent Rain proposal', time: '1d ago', type: 'revision', by: 'Board (3/5)' },
  { action: 'Cancelled after vote', series: 'Black Lotus', time: '2d ago', type: 'cancel', by: 'Board (5/5)' },
];
