"""Seed vehicle data from vividracing.com's vehicle fitment API.

Usage:
    python -m app.seed.seed_vividracing           # skip makes already in DB
    python -m app.seed.seed_vividracing --reset   # wipe vehicle tables first, then seed

Fetches makes → models → submodels (trims) for each year in YEAR_RANGE.
Submodels (e.g. "CLA 250", "CLA 300") are stored as Model.name,
giving finer fitment data than NHTSA which only has top-level model names.

Uses curl_cffi to impersonate a real Chrome TLS fingerprint and bypass
Cloudflare bot protection on vividracing.com.
"""
import asyncio
import sys
from collections import defaultdict

from curl_cffi.requests import AsyncSession
from sqlalchemy import text
from sqlmodel import Session, select

from app.database import engine, init_db
from app.models.vehicle import Make, Model, ModelYear

VIVIDRACING_BASE = "https://www.vividracing.com/vehicles/request-input"
YEAR_RANGE = range(1990, 2028)
CONCURRENT_REQUESTS = 3
DELAY_BETWEEN_YEARS = 1.5  # seconds — stay under Cloudflare rate limits
RETRY_ATTEMPTS = 3
RETRY_BACKOFF = 2.0  # seconds between retries

# Optional label overrides for makes whose vividracing label differs from your
# preferred DB name. Add entries here as needed. Everything else is inserted as-is.
MAKE_LABEL_OVERRIDES: dict[str, str] = {
    "mercedes benz": "Mercedes-Benz",
}


_EXTRA_HEADERS = {
    "Referer": "https://www.vividracing.com/",
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/javascript, */*; q=0.01",
}


async def _fetch(
    session: AsyncSession,
    semaphore: asyncio.Semaphore,
    **params,
) -> list[dict]:
    async with semaphore:
        for attempt in range(RETRY_ATTEMPTS):
            try:
                r = await session.get(
                    VIVIDRACING_BASE,
                    params=params,
                    timeout=20.0,
                    headers=_EXTRA_HEADERS,
                )
                r.raise_for_status()
                payload = r.json()
                if payload.get("error"):
                    return []
                return payload.get("data", []) or []
            except Exception as exc:
                if attempt < RETRY_ATTEMPTS - 1:
                    await asyncio.sleep(RETRY_BACKOFF * (attempt + 1))
                else:
                    print(f" [warn: {type(exc).__name__}]", end="", flush=True)
        return []


async def _collect_year(
    session: AsyncSession,
    semaphore: asyncio.Semaphore,
    year: int,
) -> dict[str, dict[str, set[str]]]:
    """Return {canonical_make: {model_label: {trim_label, ...}}} for one year."""
    result: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))

    print(f"  {year} ...", end="", flush=True)

    makes_raw = await _fetch(session, semaphore, request="makes", year=year)
    target = [
        (MAKE_LABEL_OVERRIDES.get(m["label"].lower(), m["label"]), m["id"])
        for m in makes_raw
    ]

    if not target:
        print(" (no makes returned)")
        return {}

    model_lists = await asyncio.gather(*[
        _fetch(session, semaphore, request="models", year=year, make=make_id)
        for _, make_id in target
    ])

    sub_tasks = []
    sub_meta: list[tuple[str, str]] = []
    for (canonical_make, make_id), models in zip(target, model_lists):
        for model in models:
            sub_tasks.append(
                _fetch(session, semaphore, request="submodels",
                       year=year, make=make_id, model=model["id"])
            )
            sub_meta.append((canonical_make, model["label"]))

    sub_lists = await asyncio.gather(*sub_tasks)

    count = 0
    for (canonical_make, model_label), submodels in zip(sub_meta, sub_lists):
        for sub in submodels:
            trim = sub["label"].strip()
            if trim:
                result[canonical_make][model_label].add(trim)
                count += 1

    print(f" {count} trims")
    return dict(result)


def _insert_year(db: Session, year: int, data: dict[str, dict[str, set[str]]]) -> None:
    for canonical_make, models_data in sorted(data.items()):
        make_obj = db.exec(
            select(Make).where(Make.name == canonical_make)
        ).first()
        if not make_obj:
            make_obj = Make(name=canonical_make)
            db.add(make_obj)
            db.flush()

        inserted_models = inserted_trims = extended_trims = 0
        for model_name, trims in sorted(models_data.items()):
            model_obj = db.exec(
                select(Model).where(
                    Model.make_id == make_obj.id,
                    Model.name == model_name,
                )
            ).first()
            if not model_obj:
                model_obj = Model(make_id=make_obj.id, name=model_name)
                db.add(model_obj)
                db.flush()
                inserted_models += 1

            for trim_name in sorted(trims):
                existing = db.exec(
                    select(ModelYear).where(
                        ModelYear.model_id == model_obj.id,
                        ModelYear.generation == trim_name,
                    )
                ).first()
                if existing:
                    if year > existing.year_end:
                        existing.year_end = year
                        extended_trims += 1
                else:
                    db.add(ModelYear(
                        model_id=model_obj.id,
                        year_start=year,
                        year_end=year,
                        generation=trim_name,
                    ))
                    inserted_trims += 1

        db.commit()
        print(f"    {canonical_make}: +{inserted_models} models, +{inserted_trims} trims, ~{extended_trims} extended")


def _reset_vehicles() -> None:
    with Session(engine) as session:
        session.exec(text("DELETE FROM model_years"))  # type: ignore[call-overload]
        session.exec(text("DELETE FROM models"))       # type: ignore[call-overload]
        session.exec(text("DELETE FROM makes"))        # type: ignore[call-overload]
        session.commit()
    print("Vehicle tables cleared.\n")


async def _seed_async(reset: bool = False) -> None:
    init_db()
    if reset:
        _reset_vehicles()

    print("Collecting and inserting vehicle data from vividracing.com...\n")
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    async with AsyncSession(impersonate="chrome120") as http:
        with Session(engine) as db:
            for year in YEAR_RANGE:
                data = await _collect_year(http, semaphore, year)
                if data:
                    _insert_year(db, year, data)
                await asyncio.sleep(DELAY_BETWEEN_YEARS)

    print("\nVividracing seed complete.")


def seed(reset: bool = False) -> None:
    asyncio.run(_seed_async(reset=reset))


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
