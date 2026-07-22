// Board domain types for Editorial Board dashboard

export type ActiveNav =
  | 'Dashboard'
  | 'Series Proposals'
  | 'Issue Management'
  | 'Board Voting'
  | 'Publication Schedule'
  | 'Reader Voting'
  | 'Rankings'
  | 'Cancellation Review'
  | 'Decision History'
  | 'Reports'
  | 'Settings';

export type VoteDecision = 'approve' | 'revise' | 'reject' | null;
export type PubType = 'Weekly' | 'Monthly' | 'Special';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface SeriesProposal {
  id: string;
  title: string;
  mangaka: string;
  genre: string;
  submitted: string;
  editorRec: 'Recommended' | 'Needs Discussion' | 'Not Recommended';
  votes: number;
  totalVotes: number;
  color: string;
}

export interface VotingCard {
  id: string;
  title: string;
  mangaka: string;
  genre: string;
  editorRec: string;
  recColor: string;
  votes: number;
  totalVotes: number;
  synopsis: string;
  cover: string;
  pubType: PubType;
}

export interface RankingRow {
  rank: number;
  prevRank: number;
  title: string;
  votes: number;
  positivePct: number;
  riskLevel: RiskLevel;
  genre: string;
}

export interface CancellationCard {
  id: string;
  title: string;
  rank: number;
  lowRankCount: number;
  editorNote: string;
  riskLevel: RiskLevel;
  genre: string;
}

export interface ScheduleItem {
  title: string;
  chapter: string;
  type: PubType;
  date: string;
}

export interface DecisionItem {
  action: string;
  series: string;
  time: string;
  type: 'approve' | 'cancel' | 'revision' | 'change';
  by: string;
}
