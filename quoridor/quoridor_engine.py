from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from collections import deque
import math
import time
from typing import Iterable, Optional

N = 9
INF = 10**9

# Coordinates: rows 0..8 top to bottom, cols 0..8 left to right.
# Human cell notation: a1..i9, with a1 at bottom-left. P1 starts e1, P2 starts e9.


def cell_to_rc(s: str) -> tuple[int, int]:
    s = s.strip().lower()
    if len(s) < 2:
        raise ValueError("Cellule invalide, ex: e2")
    c = ord(s[0]) - ord('a')
    rank = int(s[1:])
    if not (0 <= c < 9 and 1 <= rank <= 9):
        raise ValueError("Cellule hors plateau")
    return 9 - rank, c


def rc_to_cell(r: int, c: int) -> str:
    return f"{chr(ord('a')+c)}{9-r}"


def wall_to_rc(s: str) -> tuple[int, int]:
    # Wall anchor a1..h8, bottom-left of the 2-cell wall segment.
    r, c = cell_to_rc(s)
    # convert anchor rank/cell to wall arrays 0..7 top-based.
    # Horizontal wall at anchor x,y blocks movement between rank y and y+1 over files x,x+1.
    # Internal h row = 8 - rank = r? If rank 1 -> between rows 7 and 8 => h row 7.
    # cell_to_rc already gives top row of lower cell? rank1 r=8, horizontal row should 7, so r-1.
    # Easier: for anchor rank y, internal wall row = 8-y, col = file.
    rank = int(s.strip().lower()[1:])
    c = ord(s.strip().lower()[0]) - ord('a')
    wr = 8 - rank
    if not (0 <= wr < 8 and 0 <= c < 8):
        raise ValueError("Mur hors plateau, ex: h e4 ou v d6, coords a1..h8")
    return wr, c


def rc_to_wall(r: int, c: int) -> str:
    return f"{chr(ord('a')+c)}{8-r}"


@dataclass(frozen=True)
class Move:
    kind: str  # 'P', 'H', 'V'
    r: int
    c: int

    def __str__(self) -> str:
        if self.kind == 'P':
            return rc_to_cell(self.r, self.c)
        return f"{self.kind.lower()} {rc_to_wall(self.r, self.c)}"


@dataclass(frozen=True)
class State:
    p0: tuple[int, int] = (8, 4)
    p1: tuple[int, int] = (0, 4)
    h: frozenset[tuple[int, int]] = frozenset()
    v: frozenset[tuple[int, int]] = frozenset()
    w0: int = 10
    w1: int = 10
    turn: int = 0

    def pawn(self, player: int) -> tuple[int, int]:
        return self.p0 if player == 0 else self.p1

    def walls(self, player: int) -> int:
        return self.w0 if player == 0 else self.w1

    def winner(self) -> Optional[int]:
        if self.p0[0] == 0:
            return 0
        if self.p1[0] == 8:
            return 1
        return None

    def key(self):
        return (self.p0, self.p1, self.h, self.v, self.w0, self.w1, self.turn)


class QuoridorEngine:
    def __init__(self, max_wall_candidates: int = 28):
        self.max_wall_candidates = max_wall_candidates
        self.tt: dict[tuple, tuple[int, int, Optional[Move]]] = {}
        self.sp_cache: dict[tuple, tuple[int, list[tuple[int, int]]]] = {}
        self.deadline = 0.0
        self.nodes = 0

    @staticmethod
    def blocked(s: State, a: tuple[int, int], b: tuple[int, int]) -> bool:
        r1, c1 = a; r2, c2 = b
        if abs(r1-r2) + abs(c1-c2) != 1:
            return True
        if r2 == r1 - 1:  # moving up crosses horizontal wall row r2
            wr = r2
            wc = c1 if c1 < 8 else c1 - 1
            return (wr, wc) in s.h or (wr, wc-1) in s.h
        if r2 == r1 + 1:  # moving down crosses h row r1
            wr = r1
            wc = c1 if c1 < 8 else c1 - 1
            return (wr, wc) in s.h or (wr, wc-1) in s.h
        if c2 == c1 - 1:  # left crosses vertical wall col c2
            wc = c2
            wr = r1 if r1 < 8 else r1 - 1
            return (wr, wc) in s.v or (wr-1, wc) in s.v
        if c2 == c1 + 1:  # right crosses vertical wall col c1
            wc = c1
            wr = r1 if r1 < 8 else r1 - 1
            return (wr, wc) in s.v or (wr-1, wc) in s.v
        return False

    def neighbors(self, s: State, cell: tuple[int, int]) -> list[tuple[int, int]]:
        r, c = cell
        out = []
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < 9 and 0 <= nc < 9 and not self.blocked(s, (r,c), (nr,nc)):
                out.append((nr,nc))
        return out

    def shortest_path(self, s: State, player: int) -> tuple[int, list[tuple[int, int]]]:
        start = s.pawn(player)
        key = (start, player, s.h, s.v)
        cached = self.sp_cache.get(key)
        if cached is not None:
            return cached
        goal_row = 0 if player == 0 else 8
        q = deque([start])
        prev = {start: None}
        while q:
            x = q.popleft()
            if x[0] == goal_row:
                path = []
                cur = x
                while cur is not None:
                    path.append(cur)
                    cur = prev[cur]
                path.reverse()
                res = (len(path)-1, path)
                self.sp_cache[key] = res
                return res
            for nb in self.neighbors(s, x):
                if nb not in prev:
                    prev[nb] = x
                    q.append(nb)
        res = (INF, [])
        self.sp_cache[key] = res
        return res

    def legal_pawn_moves(self, s: State, player: Optional[int] = None) -> list[Move]:
        if player is None:
            player = s.turn
        me = s.pawn(player); opp = s.pawn(1-player)
        moves: set[tuple[int, int]] = set()
        mr, mc = me
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            adj = (mr+dr, mc+dc)
            if not (0 <= adj[0] < 9 and 0 <= adj[1] < 9):
                continue
            if self.blocked(s, me, adj):
                continue
            if adj != opp:
                moves.add(adj)
            else:
                behind = (opp[0]+dr, opp[1]+dc)
                if 0 <= behind[0] < 9 and 0 <= behind[1] < 9 and not self.blocked(s, opp, behind):
                    moves.add(behind)
                else:
                    # diagonal left/right relative to jump direction
                    for tdr, tdc in [(-dc, dr), (dc, -dr)]:
                        diag = (opp[0]+tdr, opp[1]+tdc)
                        if 0 <= diag[0] < 9 and 0 <= diag[1] < 9 and not self.blocked(s, opp, diag):
                            moves.add(diag)
        return [Move('P', r, c) for r, c in moves]

    def wall_fits(self, s: State, kind: str, r: int, c: int) -> bool:
        if not (0 <= r < 8 and 0 <= c < 8):
            return False
        if kind == 'H':
            if (r,c) in s.h or (r,c) in s.v:
                return False
            if (r,c-1) in s.h or (r,c+1) in s.h:
                return False
        else:
            if (r,c) in s.v or (r,c) in s.h:
                return False
            if (r-1,c) in s.v or (r+1,c) in s.v:
                return False
        return True

    def place_wall_raw(self, s: State, kind: str, r: int, c: int) -> State:
        h, v = s.h, s.v
        if kind == 'H':
            h = frozenset(set(h) | {(r,c)})
        else:
            v = frozenset(set(v) | {(r,c)})
        return State(s.p0, s.p1, h, v, s.w0 - (s.turn==0), s.w1 - (s.turn==1), 1-s.turn)

    def wall_legal(self, s: State, kind: str, r: int, c: int) -> bool:
        if s.walls(s.turn) <= 0 or not self.wall_fits(s, kind, r, c):
            return False
        ns = self.place_wall_raw(s, kind, r, c)
        return self.shortest_path(ns, 0)[0] < INF and self.shortest_path(ns, 1)[0] < INF

    def make_move(self, s: State, m: Move) -> State:
        if m.kind == 'P':
            if s.turn == 0:
                return State((m.r,m.c), s.p1, s.h, s.v, s.w0, s.w1, 1)
            return State(s.p0, (m.r,m.c), s.h, s.v, s.w0, s.w1, 0)
        return self.place_wall_raw(s, m.kind, m.r, m.c)

    def candidate_walls(self, s: State) -> list[Move]:
        if s.walls(s.turn) <= 0:
            return []
        d0, path0 = self.shortest_path(s, 0)
        d1, path1 = self.shortest_path(s, 1)
        cells = set(path0 + path1 + [s.p0, s.p1])
        cand: set[tuple[str,int,int]] = set()
        # Generate wall anchors around shortest paths. This captures most tactical wall moves.
        for r, c in cells:
            for rr in range(max(0, r-2), min(7, r+1)+1):
                for cc in range(max(0, c-2), min(7, c+1)+1):
                    cand.add(('H', rr, cc)); cand.add(('V', rr, cc))
        scored = []
        base = self.evaluate(s)
        for kind, r, c in cand:
            if self.wall_legal(s, kind, r, c):
                ns = self.make_move(s, Move(kind,r,c))
                # Static score from current player's perspective after the move.
                sc = -self.evaluate(ns)
                # Prefer walls that increase opponent path without hurting us too much.
                scored.append((sc, Move(kind,r,c)))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for _, m in scored[:self.max_wall_candidates]]

    def legal_moves(self, s: State) -> list[Move]:
        pms = self.legal_pawn_moves(s)
        walls = self.candidate_walls(s)
        moves = pms + walls
        return self.order_moves(s, moves)

    def evaluate(self, s: State) -> int:
        winner = s.winner()
        if winner is not None:
            return 1000000 if winner == s.turn else -1000000
        me = s.turn; opp = 1 - me
        dm, pm = self.shortest_path(s, me)
        do, po = self.shortest_path(s, opp)
        my_mob = len(self.legal_pawn_moves(s, me))
        op_mob = len(self.legal_pawn_moves(s, opp))
        # Big emphasis on racing distance; walls matter, mobility tie-breaks.
        score = (do - dm) * 120 + (s.walls(me) - s.walls(opp)) * 7 + (my_mob - op_mob) * 4
        # Bonus if my shortest path is centered/flexible.
        if pm:
            score -= abs(pm[min(1, len(pm)-1)][1] - 4) * 2
        if po:
            score += abs(po[min(1, len(po)-1)][1] - 4) * 2
        return int(score)

    def order_moves(self, s: State, moves: list[Move]) -> list[Move]:
        scored = []
        for m in moves:
            if m.kind == 'P':
                # Pawn moves that reduce own distance first.
                ns = self.make_move(s, m)
                sc = -self.evaluate(ns) + 20
            else:
                ns = self.make_move(s, m)
                sc = -self.evaluate(ns)
            scored.append((sc, m))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [m for sc, m in scored]

    def negamax(self, s: State, depth: int, alpha: int, beta: int) -> tuple[int, Optional[Move]]:
        if time.time() > self.deadline:
            raise TimeoutError
        self.nodes += 1
        winner = s.winner()
        if winner is not None or depth == 0:
            return self.evaluate(s), None
        key = (s.key(), depth)
        if key in self.tt:
            val, flag, mv = self.tt[key]
            return val, mv
        best_val = -INF
        best_move = None
        a0 = alpha
        moves = self.legal_moves(s)
        if not moves:
            return self.evaluate(s), None
        for m in moves:
            ns = self.make_move(s, m)
            val, _ = self.negamax(ns, depth-1, -beta, -alpha)
            val = -val
            if val > best_val:
                best_val = val; best_move = m
            alpha = max(alpha, val)
            if alpha >= beta:
                break
        self.tt[key] = (best_val, 0, best_move)
        return best_val, best_move

    def best_move(self, s: State, time_limit: float = 5.0, max_depth: int = 5) -> tuple[Move, int, int, int]:
        self.deadline = time.time() + time_limit
        self.nodes = 0
        self.tt.clear()
        best = None; best_score = -INF; reached = 0
        # Always have a legal fallback.
        legal = self.legal_moves(s)
        if not legal:
            raise ValueError("Aucun coup légal")
        best = legal[0]
        try:
            for d in range(1, max_depth + 1):
                score, mv = self.negamax(s, d, -INF, INF)
                if mv is not None:
                    best, best_score, reached = mv, score, d
        except TimeoutError:
            pass
        return best, best_score, reached, self.nodes


def initial_state() -> State:
    return State()


def parse_move(text: str) -> Move:
    t = text.strip().lower().replace(',', ' ')
    parts = t.split()
    if not parts:
        raise ValueError("Coup vide")
    if parts[0] in ('p', 'pawn'):
        r, c = cell_to_rc(parts[1])
        return Move('P', r, c)
    if parts[0] in ('h', 'horizontal'):
        r, c = wall_to_rc(parts[1])
        return Move('H', r, c)
    if parts[0] in ('v', 'vertical'):
        r, c = wall_to_rc(parts[1])
        return Move('V', r, c)
    # Cell alone = pawn move.
    if parts[0][0] in 'abcdefghi':
        r, c = cell_to_rc(parts[0])
        return Move('P', r, c)
    raise ValueError("Format: e2, h e4 ou v d6")


def render_ascii(s: State) -> str:
    lines = []
    for r in range(9):
        row = []
        for c in range(9):
            ch = '.'
            if s.p0 == (r,c): ch = 'A'
            if s.p1 == (r,c): ch = 'B'
            row.append(ch)
            if c < 8:
                row.append('|' if ((r if r < 8 else r-1, c) in s.v or (r-1, c) in s.v) else ' ')
        lines.append(f"{9-r} " + ''.join(row))
        if r < 8:
            sep = []
            for c in range(9):
                sep.append('-' if ((r, c if c < 8 else c-1) in s.h or (r, c-1) in s.h) else ' ')
                if c < 8: sep.append('+')
            lines.append('  ' + ''.join(sep))
    lines.append('  abcdefghi')
    lines.append(f"Tour: {'A/P1 vers rank 9' if s.turn==0 else 'B/P2 vers rank 1'} | murs A={s.w0}, B={s.w1}")
    return '\n'.join(lines)
