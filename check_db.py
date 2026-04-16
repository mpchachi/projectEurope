import db, json

for student in ['student-1', 'student-2']:
    rows = db.get_history(student, limit=10)
    if not rows:
        continue
    print(f'\n=== {student} ({len(rows)} sesiones) ===')
    for r in rows:
        result = r['result']
        cefr   = result.get('cefr', {})
        talk   = result.get('talk_ratio', {})
        nw     = result.get('new_words', {})
        errors = result.get('top_errors', [])
        print(f"\n  [{r['analyzed_at'][:19]}]  label={r['label']}  cefr={r['cefr_level']}")
        print(f"  Talk ratio  → student {talk.get('student_pct')}%  tutor {talk.get('tutor_pct')}%")
        print(f"  New words   → {nw.get('new_count')} nuevas / {nw.get('total_vocab')} total")
        print(f"  CEFR        → {cefr.get('level')} ({cefr.get('confidence')}) — {cefr.get('reasoning','')[:80]}...")
        print(f"  Top errors  → {len(errors)} errores guardados")
        if errors:
            print(f"    ✗ \"{errors[0].get('error','')}\"")
