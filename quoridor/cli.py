from quoridor_engine import QuoridorEngine, State, Move, initial_state, parse_move, render_ascii


def is_legal(engine, s, m):
    if m.kind == 'P':
        return m in engine.legal_pawn_moves(s)
    return engine.wall_legal(s, m.kind, m.r, m.c)


def main():
    print("Quoridor Solver - IA forte alpha-beta")
    print("Notation: déplacement = e2 ; mur horizontal = h e4 ; mur vertical = v d6")
    print("A/P1 commence en e1 et va vers e9. B/P2 commence en e9 et va vers e1.")
    print("Commandes: best, play <coup>, auto, undo, quit")
    s = initial_state()
    engine = QuoridorEngine(max_wall_candidates=32)
    hist = []
    while True:
        print(render_ascii(s))
        if s.winner() is not None:
            print("Gagnant:", "A/P1" if s.winner()==0 else "B/P2")
            break
        cmd = input("> ").strip()
        if not cmd:
            continue
        if cmd in ("q", "quit", "exit"):
            break
        if cmd == "undo":
            if hist:
                s = hist.pop()
            continue
        if cmd.startswith("best"):
            parts = cmd.split()
            seconds = float(parts[1]) if len(parts) > 1 else 5.0
            mv, score, depth, nodes = engine.best_move(s, time_limit=seconds, max_depth=6)
            print(f"Meilleur coup: {mv} | score {score} | profondeur {depth} | noeuds {nodes}")
            continue
        if cmd == "auto":
            mv, score, depth, nodes = engine.best_move(s, time_limit=5.0, max_depth=6)
            print(f"IA joue: {mv} | score {score} | profondeur {depth} | noeuds {nodes}")
            hist.append(s)
            s = engine.make_move(s, mv)
            continue
        if cmd.startswith("play "):
            text = cmd[5:]
        else:
            text = cmd
        try:
            mv = parse_move(text)
            if not is_legal(engine, s, mv):
                print("Coup illégal.")
                continue
            hist.append(s)
            s = engine.make_move(s, mv)
        except Exception as e:
            print("Erreur:", e)


if __name__ == "__main__":
    main()
