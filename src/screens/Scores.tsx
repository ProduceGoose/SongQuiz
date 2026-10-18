// Scores: your recent games and the final standings of the one you pick.
import { useState } from 'react';
import { Leaderboard, type LeaderboardPlayer } from '../components/tables/Leaderboard';
import { ScreenHeader, Section } from '../components/content/Layout';
import { Table, rowLink } from '../components/tables/Table';
import { pastGames, playlistById } from '../data/demo';
import { ME, type PastGame, type ScreenDef, type ScreenProps } from '../types';

/** Past games store "you" without a name; fill in the current display name. */
function withYou(game: PastGame, myName: string): LeaderboardPlayer[] {
  return game.players.map((p) => (p.id === ME ? { ...p, name: myName, note: '(you)' } : { ...p, name: p.name ?? '' }));
}

function winnerOf(game: PastGame) {
  return game.players.reduce((best, p) => (p.score > best.score ? p : best));
}

function Scores({ app }: ScreenProps) {
  const [selectedId, setSelectedId] = useState(pastGames[0].id);
  const game = pastGames.find((g) => g.id === selectedId) ?? pastGames[0];
  const playlist = playlistById(game.playlistId);

  return (
    <div className="app-screen">
      <ScreenHeader align="left" title="Scores" hint={`Your last ${pastGames.length} games. Pick one to see the final standings.`} />

      <Table
        caption="Recent games"
        columns={[{ label: 'Date' }, { label: 'Room' }, { label: 'Playlist' }, { label: 'Players', className: 'sq-col-num' }, { label: 'Winner' }]}
      >
        {pastGames.map((g) => {
          const winner = winnerOf(g);
          return (
            <tr key={g.id} {...rowLink(() => setSelectedId(g.id), g.id === game.id)}>
              <td>{g.date}</td>
              <td>{g.room}</td>
              <td>{playlistById(g.playlistId).title}</td>
              <td className="sq-col-num">{g.players.length}</td>
              <td>{winner.id === ME ? `${app.settings.name} (you)` : winner.name}</td>
            </tr>
          );
        })}
      </Table>

      <Section title={game.room} hint={`Final scores · ${game.date} · ${playlist.title}`}>
        <div className="app-table">
          <Leaderboard players={withYou(game, app.settings.name)} highlight={ME} caption={'Final scores for ' + game.room} />
        </div>
      </Section>
    </div>
  );
}

export const scoresScreen: ScreenDef = {
  title: 'Scores',
  Component: Scores,
  lcd: () => {
    const last = pastGames[0];
    const winner = winnerOf(last);
    return { title: 'Scores', subtitle: `Last game: ${last.room} · won by ${winner.name ?? 'you'}` };
  },
  status: () => `${pastGames.length} games played`
};
