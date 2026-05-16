"""Translate spell descriptions from English to Spanish using Google Translate.

Usage:
    pip install deep-translator
    python translate_spells.py

Run from the project root (same directory as api/).
"""
import sqlite3
import json
import time
from deep_translator import GoogleTranslator

DB_PATH = "api/dnd_nexus.db"
TRANSLATOR = GoogleTranslator(source="en", target="es")
MAX_DESC_LEN = 4000  # Google Translate limit per request
BATCH_SIZE = 5       # Translate N spells then commit
DELAY = 1.2          # Seconds between requests (avoid rate limits)


def translate_text(text: str) -> str:
    """Translate a text chunk, handling long descriptions."""
    if not text or len(text.strip()) < 10:
        return text
    # Split on paragraphs for better translation quality
    paragraphs = text.split("\n\n")
    translated = []
    for para in paragraphs:
        if not para.strip():
            translated.append("")
            continue
        if len(para) > MAX_DESC_LEN:
            # Split long paragraphs by sentences
            sentences = para.split(". ")
            chunk = ""
            for s in sentences:
                if len(chunk) + len(s) + 2 > MAX_DESC_LEN:
                    if chunk.strip():
                        translated.append(TRANSLATOR.translate(chunk.strip()))
                    chunk = s + ". "
                else:
                    chunk += s + ". "
            if chunk.strip():
                translated.append(TRANSLATOR.translate(chunk.strip()))
        else:
            translated.append(TRANSLATOR.translate(para.strip()))
    return "\n\n".join(translated)


def is_already_spanish(text: str) -> bool:
    """Quick heuristic: if text contains common Spanish words, skip."""
    if not text:
        return False
    lower = text.lower()
    spanish_markers = [
        "lanzar", "conjuro", "hechizo", "objetivo", "criatura",
        "alcance", "duración", "componentes", "salvación",
        "puntos de golpe", "daño", "resistencia", "inmunidad",
        "efecto", "área", "radio", "línea", "cono",
        "tu", "tus", "él", "ella", "ellos", "ellas",
        "puedes", "debes", "debe", "tiene", "tienen",
        "cuando", "mientras", "hasta", "después", "antes",
        "cada", "todos", "todas", "uno", "una", "unos", "unas",
    ]
    return any(m in lower for m in spanish_markers[:10])


def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute('SELECT id, name, description FROM spells ORDER BY id')
    all_spells = c.fetchall()
    total = len(all_spells)

    to_translate = []
    already_spanish = 0
    no_description = 0

    for spell_id, name, desc in all_spells:
        if not desc or len(desc.strip()) < 5:
            no_description += 1
            continue
        if is_already_spanish(desc):
            already_spanish += 1
            continue
        to_translate.append((spell_id, name, desc))

    print(f"Total spells: {total}")
    print(f"  No description: {no_description}")
    print(f"  Already Spanish: {already_spanish}")
    print(f"  Need translation: {len(to_translate)}")
    print()

    if not to_translate:
        print("Nothing to translate!")
        conn.close()
        return

    translated_count = 0
    failed = []

    for i, (spell_id, name, desc) in enumerate(to_translate):
        try:
            translated = translate_text(desc)
            c.execute(
                'UPDATE spells SET description = ? WHERE id = ?',
                (translated, spell_id)
            )
            translated_count += 1
            print(f"  [{i+1}/{len(to_translate)}] ✓ {name}")

            if translated_count % BATCH_SIZE == 0:
                conn.commit()
                print(f"    → Committed batch of {BATCH_SIZE}")
                time.sleep(DELAY)

        except Exception as e:
            print(f"  [{i+1}/{len(to_translate)}] ✗ {name}: {e}")
            failed.append((spell_id, name))
            time.sleep(3)  # Longer delay on error

    conn.commit()
    conn.close()

    print(f"\nDone! Translated {translated_count} spells.")
    if failed:
        print(f"Failed ({len(failed)}):")
        for fid, fname in failed:
            print(f"  id={fid}: {fname}")


if __name__ == "__main__":
    main()
