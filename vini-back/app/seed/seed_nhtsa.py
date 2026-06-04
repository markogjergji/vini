"""Seed vehicle makes and models from the NHTSA public API.

Usage:
    python -m app.seed.seed_nhtsa           # skip makes already in DB
    python -m app.seed.seed_nhtsa --reset   # wipe vehicle tables first, then seed

Fetches makes/models from https://vpic.nhtsa.dot.gov/api/ and resolves
year ranges (2000-2025) by querying each year concurrently per make.
Generation codes are not available from NHTSA and will be NULL.

Add or remove entries from POPULAR_MAKES to control what gets imported.
"""
import asyncio
import sys

import httpx
from sqlalchemy import text
from sqlmodel import Session, select

from app.database import engine, init_db
from app.models.vehicle import Make, Model, ModelYear

NHTSA_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles"
YEAR_RANGE = range(2000, 2026)
CONCURRENT_REQUESTS = 8

POPULAR_MAKES = {
    "Mini",
    "Toyota",
    "Honda",
    "Ford",
    "Volkswagen",
    "BMW",
    "Mercedes-Benz",
    "Audi",
    "Chevrolet",
    "Nissan",
    "Hyundai",
    "Kia",
    "Mazda",
    "Subaru",
    "Volvo",
    "Peugeot",
    "Renault",
    "Fiat",
    "Opel",
    "Skoda",
    "Seat",
    "Porsche",
    "Land Rover",
    "Jeep",
    "Dodge",
    "Mitsubishi",
    "Suzuki",
    "Lexus",
    "Alfa Romeo",
    "Chrysler",
    "Ram",
}


async def _get_all_makes(client: httpx.AsyncClient) -> list[str]:
    r = await client.get(f"{NHTSA_BASE}/GetAllMakes?format=json")
    r.raise_for_status()
    return [m["Make_Name"] for m in r.json()["Results"]]


async def _get_models_for_make(client: httpx.AsyncClient, make: str) -> list[str]:
    r = await client.get(f"{NHTSA_BASE}/GetModelsForMake/{make}?format=json")
    r.raise_for_status()
    return [m["Model_Name"] for m in r.json()["Results"]]


async def _get_models_for_make_year(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    make: str,
    year: int,
) -> tuple[int, set[str]]:
    async with semaphore:
        try:
            r = await client.get(
                f"{NHTSA_BASE}/GetModelsForMakeYear/make/{make}/modelyear/{year}?format=json",
                timeout=15.0,
            )
            r.raise_for_status()
            return year, {m["Model_Name"] for m in r.json()["Results"]}
        except Exception:
            return year, set()


async def _build_active_years(
    client: httpx.AsyncClient,
    make: str,
    models: list[str],
) -> dict[str, list[int]]:
    """Return {model_name: [year, ...]} for each year the model was active in 2000-2025."""
    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    results = await asyncio.gather(*[
        _get_models_for_make_year(client, semaphore, make, year)
        for year in YEAR_RANGE
    ])

    model_set = set(models)
    active_years: dict[str, list[int]] = {}

    for year, year_models in results:
        for name in year_models & model_set:
            active_years.setdefault(name, []).append(year)

    return active_years


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

    popular_upper = {m.upper(): m for m in POPULAR_MAKES}

    async with httpx.AsyncClient(timeout=30.0) as client:
        print("Fetching all makes from NHTSA...")
        all_makes = await _get_all_makes(client)

        # Match case-insensitively; use the canonical POPULAR_MAKES name for DB
        makes_to_import: list[tuple[str, str]] = []
        for nhtsa_name in all_makes:
            canonical = popular_upper.get(nhtsa_name.upper())
            if canonical:
                makes_to_import.append((canonical, nhtsa_name))

        makes_to_import.sort()
        print(f"Matched {len(makes_to_import)} makes to import\n")

        with Session(engine) as session:
            for canonical_name, nhtsa_name in makes_to_import:
                if session.exec(select(Make).where(Make.name == canonical_name)).first():
                    print(f"  {canonical_name}: already exists, skipping")
                    continue

                print(f"  {canonical_name}: fetching models...", end="", flush=True)
                models = await _get_models_for_make(client, nhtsa_name)
                print(f" {len(models)} found. Resolving years...", end="", flush=True)

                active_years = await _build_active_years(client, nhtsa_name, models)
                print(f" {len(active_years)} active in 2000-2025")

                if not active_years:
                    continue

                make_obj = Make(name=canonical_name)
                session.add(make_obj)
                session.flush()

                for model_name, years in sorted(active_years.items()):
                    model_obj = Model(make_id=make_obj.id, name=model_name)  # type: ignore[arg-type]
                    session.add(model_obj)
                    session.flush()

                    for year in sorted(years):
                        session.add(ModelYear(
                            model_id=model_obj.id,  # type: ignore[arg-type]
                            year_start=year,
                            year_end=year,
                            generation=None,
                        ))

                session.commit()

    print("\nNHTSA seed complete.")


def seed(reset: bool = False) -> None:
    asyncio.run(_seed_async(reset=reset))


if __name__ == "__main__":
    seed(reset="--reset" in sys.argv)
