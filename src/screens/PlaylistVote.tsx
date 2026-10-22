// Playlist voting before a casual game (Round.vote, game/playlistPick.ts): three covers with their
// votes so far, yours highlighted, and the seconds left. Click a cover to vote; until the time is
// up you can change it. Then the winner pops forward while the others fade, for VOTE_REVEAL_MS,
// before round 1. It covers the window until then.
import { playlistById } from '../data/demo';
import { voteCounts } from '../game/playlistPick';
import { ME, type Round } from '../types';
import './SlotMachine.css';

interface PlaylistVoteProps {
  round: Round;
  onVote: (playlistId: string) => void;
  /** Players in the room, for "2 of 4 voted". */
  players: number;
}

export function PlaylistVote({ round, onVote, players }: PlaylistVoteProps) {
  const vote = round.vote!;
  const counts = voteCounts(vote);
  const mine = vote.votes[ME];
  const { winner } = vote;
  const left = Math.max(0, Math.ceil((vote.until - Date.now()) / 1000));
  const voted = Object.keys(vote.votes).length;
  const winnerVotes = winner ? counts[vote.options.indexOf(winner)]! : 0;

  return (
    <div className="app-slot" role="dialog" aria-modal="true" aria-label="Vote for the playlist">
      <div className={winner ? 'app-slot-machine app-vote is-decided' : 'app-slot-machine app-vote'}>
        <div className="app-slot-head">
          <span className="app-slot-level">{winner ? 'The vote is in' : 'Vote for the playlist'}</span>
          {winner ? null : <span className="app-vote-time" aria-label={`${left} seconds left`}>{left} s</span>}
        </div>
        <div className="app-vote-options">
          {vote.options.map((id, i) => {
            const p = playlistById(id);
            const state = winner ? (id === winner ? ' is-winner' : ' is-out') : mine === id ? ' is-on' : '';
            return (
              <button
                type="button" key={id} className={'app-vote-option' + state} aria-pressed={mine === id}
                disabled={!!winner} onClick={() => onVote(id)}
              >
                {id === winner ? <span className="app-vote-badge">Winner</span> : null}
                <img src={p.art} alt="" />
                <span className="app-vote-title">{p.title}</span>
                <span className="app-vote-count">{counts[i]} {counts[i] === 1 ? 'vote' : 'votes'}</span>
              </button>
            );
          })}
        </div>
        <div className="app-slot-caption" aria-live="polite">
          {winner ? (
            <><strong>{playlistById(winner).title}</strong> wins{winnerVotes ? ` with ${winnerVotes} ${winnerVotes === 1 ? 'vote' : 'votes'}` : ''}!</>
          ) : (
            <>
              {mine ? <>You voted for <strong>{playlistById(mine).title}</strong>. You can still change it.</> : 'Click a playlist to vote.'}
              {' '}{voted} of {players} voted.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
