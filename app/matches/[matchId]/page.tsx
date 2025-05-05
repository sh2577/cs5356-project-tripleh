'use client';

import { MatchChat } from '../../../components/match-chat';
import { useParams } from 'next/navigation';

export default function MatchPage() {
    const params = useParams();
    const matchId = params?.matchId as string;

    return <MatchChat matchId={matchId} />;
}
