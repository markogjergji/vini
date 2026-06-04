"""Seed fake parts data for testing.

Usage:
    python -m app.seed.seed_parts           # add 200 fake parts
    python -m app.seed.seed_parts --count 500   # add a custom number
    python -m app.seed.seed_parts --reset   # wipe parts tables first, then seed
"""
import random
import sys
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlmodel import Session, select

from app.core.security import hash_password
from app.database import engine, init_db
from app.models.enums import ListingStatus, PartCondition
from app.models.part import Part, PartCategory, PartCompatibility, PartImage
from app.models.seller import Seller
from app.models.user import User, UserRole
from app.models.vehicle import ModelYear

CATEGORIES = [
    ("Engine & Drivetrain", "engine-drivetrain", [
        ("Engine Parts", "engine-parts"),
        ("Transmission", "transmission"),
        ("Exhaust System", "exhaust-system"),
        ("Fuel System", "fuel-system"),
    ]),
    ("Brakes & Suspension", "brakes-suspension", [
        ("Brake Pads & Rotors", "brake-pads-rotors"),
        ("Suspension & Steering", "suspension-steering"),
        ("Shocks & Struts", "shocks-struts"),
    ]),
    ("Body & Exterior", "body-exterior", [
        ("Bumpers & Grilles", "bumpers-grilles"),
        ("Doors & Windows", "doors-windows"),
        ("Lights & Lamps", "lights-lamps"),
        ("Mirrors", "mirrors"),
    ]),
    ("Interior", "interior", [
        ("Seats & Upholstery", "seats-upholstery"),
        ("Dashboard & Console", "dashboard-console"),
        ("Trim & Moulding", "trim-moulding"),
    ]),
    ("Electrical", "electrical", [
        ("Batteries & Charging", "batteries-charging"),
        ("Sensors & Switches", "sensors-switches"),
        ("Alternators & Starters", "alternators-starters"),
    ]),
    ("Cooling & Heating", "cooling-heating", [
        ("Radiators", "radiators"),
        ("A/C & Heating", "ac-heating"),
        ("Water Pumps", "water-pumps"),
    ]),
    ("Filters & Fluids", "filters-fluids", [
        ("Air Filters", "air-filters"),
        ("Oil Filters", "oil-filters"),
        ("Fuel Filters", "fuel-filters"),
    ]),
    ("Wheels & Tyres", "wheels-tyres", [
        ("Rims & Wheels", "rims-wheels"),
        ("Tyres", "tyres"),
        ("Wheel Covers", "wheel-covers"),
    ]),
]

PART_TITLES = {
    "engine-parts": ["Valve Cover Gasket", "Timing Belt Kit", "Piston Rings Set", "Camshaft", "Crankshaft Pulley", "Oil Pump", "Engine Mount"],
    "transmission": ["Clutch Kit", "Gear Shift Knob", "Flywheel", "Transmission Filter", "CV Joint", "Drive Shaft"],
    "exhaust-system": ["Catalytic Converter", "Muffler", "Exhaust Manifold", "O2 Sensor", "Exhaust Pipe", "Flex Pipe"],
    "fuel-system": ["Fuel Pump", "Fuel Injector", "Throttle Body", "Fuel Pressure Regulator", "Carburettor"],
    "brake-pads-rotors": ["Front Brake Pads", "Rear Brake Pads", "Brake Rotor Set", "Brake Caliper", "Brake Drum", "Brake Master Cylinder"],
    "suspension-steering": ["Control Arm", "Tie Rod End", "Ball Joint", "Sway Bar Link", "Power Steering Pump", "Rack and Pinion"],
    "shocks-struts": ["Front Shock Absorber", "Rear Shock Absorber", "Strut Assembly", "Coil Spring"],
    "bumpers-grilles": ["Front Bumper Cover", "Rear Bumper Cover", "Grille Assembly", "Bumper Reinforcement", "Fog Light Bezel"],
    "doors-windows": ["Door Handle", "Window Regulator", "Door Lock Actuator", "Windshield", "Side Window", "Door Hinge"],
    "lights-lamps": ["Headlight Assembly", "Tail Light Assembly", "Fog Light", "Turn Signal Light", "Brake Light Bulb", "DRL LED Strip"],
    "mirrors": ["Driver Side Mirror", "Passenger Side Mirror", "Mirror Glass", "Mirror Cover"],
    "seats-upholstery": ["Driver Seat", "Rear Bench Seat", "Seat Cover Set", "Seat Foam Cushion", "Headrest"],
    "dashboard-console": ["Instrument Cluster", "Center Console Lid", "Glove Box", "Speedometer", "Gauge Cluster"],
    "trim-moulding": ["Door Trim Panel", "Fender Moulding", "Window Trim Strip", "Rocker Panel Trim"],
    "batteries-charging": ["12V Car Battery", "Battery Terminal", "Battery Tray", "Battery Clamp Set"],
    "sensors-switches": ["MAP Sensor", "MAF Sensor", "Crankshaft Position Sensor", "ABS Wheel Speed Sensor", "Coolant Temperature Sensor"],
    "alternators-starters": ["Alternator", "Starter Motor", "Alternator Pulley", "Voltage Regulator"],
    "radiators": ["Radiator Assembly", "Radiator Cap", "Radiator Hose", "Coolant Reservoir"],
    "ac-heating": ["A/C Compressor", "Heater Core", "Blower Motor", "A/C Condenser", "Cabin Air Filter"],
    "water-pumps": ["Water Pump", "Thermostat", "Thermostat Housing"],
    "air-filters": ["Engine Air Filter", "Performance Air Filter", "Cold Air Intake"],
    "oil-filters": ["Oil Filter", "Oil Drain Plug", "Oil Dipstick"],
    "fuel-filters": ["Inline Fuel Filter", "Fuel Tank Strainer", "Fuel Cap"],
    "rims-wheels": ["16\" Alloy Wheel", "17\" Steel Rim", "18\" Alloy Rim", "Spare Wheel", "Hub Cap"],
    "tyres": ["Summer Tyre 205/55R16", "All-Season Tyre 195/65R15", "Winter Tyre 215/60R16"],
    "wheel-covers": ["Hub Cap Set", "Wheel Cover 15\"", "Chrome Wheel Cap"],
}

ALBANIAN_CITIES = [
    ("Tirana", 41.3275, 19.8187),
    ("Durrës", 41.3246, 19.4565),
    ("Vlorë", 40.4667, 19.4833),
    ("Shkodër", 42.0683, 19.5126),
    ("Fier", 40.7239, 19.5567),
    ("Elbasan", 41.1125, 20.0822),
    ("Korçë", 40.6186, 20.7808),
    ("Berat", 40.7058, 19.9522),
    ("Lushnjë", 40.9419, 19.7058),
    ("Pogradec", 40.9022, 20.6525),
]

OEM_PREFIXES = ["BMW", "TOY", "VW", "FRD", "AUD", "MB", "HON", "NIS", "OPL", "SKD"]


def _ensure_categories(session: Session) -> dict[str, int]:
    slug_to_id: dict[str, int] = {}
    for sort_i, (parent_name, parent_slug, children) in enumerate(CATEGORIES):
        parent = session.exec(select(PartCategory).where(PartCategory.slug == parent_slug)).first()
        if not parent:
            parent = PartCategory(name=parent_name, slug=parent_slug, sort_order=sort_i)
            session.add(parent)
            session.flush()
        slug_to_id[parent_slug] = parent.id  # type: ignore[assignment]
        for child_sort, (child_name, child_slug) in enumerate(children):
            child = session.exec(select(PartCategory).where(PartCategory.slug == child_slug)).first()
            if not child:
                child = PartCategory(name=child_name, slug=child_slug, parent_id=parent.id, sort_order=child_sort)
                session.add(child)
                session.flush()
            slug_to_id[child_slug] = child.id  # type: ignore[assignment]
    session.commit()
    return slug_to_id


def _get_or_create_seed_seller(session: Session) -> int:
    user = session.exec(select(User).where(User.username == "seed_seller")).first()
    if not user:
        user = User(
            email="seed@vini.al",
            username="seed_seller",
            full_name="Seed Seller",
            hashed_password=hash_password("seed1234"),
            role=UserRole.seller,
        )
        session.add(user)
        session.flush()

    seller = session.exec(select(Seller).where(Seller.name == "Seed Seller")).first()
    if seller:
        if seller.user_id is None:
            seller.user_id = user.id
            session.commit()
        return seller.id  # type: ignore[return-value]

    seller = Seller(
        user_id=user.id,
        name="Seed Seller",
        phone="+355 69 000 0000",
        email="seed@vini.al",
        business_name="Vini Test Parts",
        city="Tirana",
        latitude=41.3275,
        longitude=19.8187,
        is_business=True,
        is_verified=True,
    )
    session.add(seller)
    session.commit()
    session.refresh(seller)
    return seller.id  # type: ignore[return-value]


def seed(count: int = 200, reset: bool = False) -> None:
    init_db()
    with Session(engine) as session:
        if reset:
            print("Wiping parts tables…")
            for tbl in ("part_compatibilities", "part_images", "parts"):
                session.exec(text(f"DELETE FROM {tbl}"))  # type: ignore[call-overload]
            session.commit()
            print("Done.")

        print("Ensuring categories…")
        slug_to_id = _ensure_categories(session)
        leaf_slugs = [s for s in slug_to_id if s not in {p for _, p, _ in CATEGORIES}]

        seller_id = _get_or_create_seed_seller(session)

        model_years_raw = session.exec(  # type: ignore[assignment]
            text("SELECT id, year_start, year_end FROM model_years ORDER BY RANDOM() LIMIT 500")
        ).fetchall()
        # list of (id, year_start, year_end)
        model_year_rows = [(r[0], r[1], r[2]) for r in model_years_raw]
        model_year_ids = [r[0] for r in model_year_rows]
        my_year_map = {r[0]: (r[1], r[2]) for r in model_year_rows}

        conditions = list(PartCondition)
        statuses = [ListingStatus.active] * 7 + [ListingStatus.sold] * 2 + [ListingStatus.reserved]

        print(f"Inserting {count} fake parts…")
        for i in range(count):
            slug = random.choice(leaf_slugs)
            titles = PART_TITLES.get(slug, ["Generic Part"])
            title = random.choice(titles)
            suffix = random.choice(["OEM", "Aftermarket", "Used", "Brand New", "Reconditioned", ""])[0:20]
            if suffix:
                title = f"{title} — {suffix}"

            city_name, lat, lon = random.choice(ALBANIAN_CITIES)
            lat += random.uniform(-0.05, 0.05)
            lon += random.uniform(-0.05, 0.05)

            price = round(random.choice([
                random.uniform(5, 50),
                random.uniform(50, 300),
                random.uniform(300, 1500),
            ]), 2)

            oem = None
            if random.random() < 0.4:
                oem = f"{random.choice(OEM_PREFIXES)}-{random.randint(10000, 99999)}"

            created_at = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 365))

            part = Part(
                seller_id=seller_id,
                category_id=slug_to_id[slug],
                title=title,
                description=f"Good condition part. {random.choice(['Fits various models.', 'OEM quality.', 'Tested and working.', 'Removed from a running vehicle.', ''])}",
                price=price,
                currency="ALL",
                condition=random.choice(conditions),
                status=random.choice(statuses),
                oem_number=oem,
                location_text=city_name,
                latitude=round(lat, 6),
                longitude=round(lon, 6),
                created_at=created_at,
                updated_at=created_at,
            )
            session.add(part)
            session.flush()

            # attach 1-3 placeholder images
            img_count = random.randint(1, 4)
            seed_offset = random.randint(1, 900)
            for img_i in range(img_count):
                pic_id = seed_offset + img_i
                session.add(PartImage(
                    part_id=part.id,
                    filename=f"seed_{pic_id}.jpg",
                    url=f"https://picsum.photos/seed/{pic_id}/800/600",
                    is_primary=(img_i == 0),
                    sort_order=img_i,
                ))

            # attach 1-3 random vehicle compatibilities
            if model_year_ids:
                compat_ids = random.sample(model_year_ids, min(random.randint(1, 3), len(model_year_ids)))
                seen: set[int] = set()
                for my_id in compat_ids:
                    if my_id in seen:
                        continue
                    seen.add(my_id)
                    yr_start, yr_end = my_year_map.get(my_id, (2000, 2024))
                    yr_end = yr_end or 2024
                    specific_year = random.randint(yr_start, yr_end)
                    session.add(PartCompatibility(part_id=part.id, model_year_id=my_id, specific_year=specific_year))

            if (i + 1) % 50 == 0:
                session.commit()
                print(f"  {i + 1}/{count} inserted…")

        session.commit()
        print(f"Done — {count} parts seeded.")


if __name__ == "__main__":
    count = 200
    reset = "--reset" in sys.argv
    for arg in sys.argv[1:]:
        if arg.startswith("--count"):
            _, _, val = arg.partition("=")
            if not val and sys.argv.index(arg) + 1 < len(sys.argv):
                val = sys.argv[sys.argv.index(arg) + 1]
            try:
                count = int(val)
            except ValueError:
                pass
    seed(count=count, reset=reset)
