from sqlmodel import Session, select

from app.database import engine, init_db
from app.models.vehicle import Make, Model, ModelYear
from app.models.part import PartCategory

VEHICLES: dict[str, dict[str, list[tuple[int, int, str | None]]]] = {
    "Toyota": {
        "Corolla": [(2002, 2007, "E120"), (2007, 2013, "E140/E150"), (2013, 2019, "E170"), (2019, 2025, "E210")],
        "Yaris": [(1999, 2005, "XP10"), (2005, 2011, "XP90"), (2011, 2020, "XP130")],
        "Auris": [(2006, 2012, "E150"), (2012, 2018, "E180")],
        "RAV4": [(2000, 2005, "XA20"), (2005, 2012, "XA30"), (2013, 2018, "XA40")],
        "Avensis": [(2003, 2008, "T250"), (2009, 2018, "T270")],
    },
    "Mercedes-Benz": {
        "C-Class": [(2000, 2007, "W203"), (2007, 2014, "W204"), (2014, 2021, "W205")],
        "E-Class": [(2002, 2009, "W211"), (2009, 2016, "W212"), (2016, 2023, "W213")],
        "A-Class": [(2004, 2012, "W169"), (2012, 2018, "W176"), (2018, 2025, "W177")],
        "B-Class": [(2005, 2011, "W245"), (2011, 2018, "W246")],
    },
    "Volkswagen": {
        "Golf": [(2003, 2009, "Mk5"), (2009, 2013, "Mk6"), (2013, 2020, "Mk7"), (2020, 2025, "Mk8")],
        "Passat": [(2005, 2010, "B6"), (2010, 2014, "B7"), (2015, 2023, "B8")],
        "Polo": [(2001, 2009, "9N"), (2009, 2017, "6R/6C"), (2017, 2025, "AW")],
        "Tiguan": [(2007, 2016, "5N"), (2016, 2025, "AD1")],
    },
    "BMW": {
        "3 Series": [(2005, 2011, "E90"), (2012, 2018, "F30"), (2019, 2025, "G20")],
        "5 Series": [(2003, 2010, "E60"), (2010, 2016, "F10"), (2017, 2023, "G30")],
        "1 Series": [(2004, 2011, "E87"), (2011, 2019, "F20"), (2019, 2025, "F40")],
        "X3": [(2003, 2010, "E83"), (2010, 2017, "F25"), (2017, 2025, "G01")],
    },
    "Audi": {
        "A3": [(2003, 2012, "8P"), (2012, 2020, "8V"), (2020, 2025, "8Y")],
        "A4": [(2000, 2008, "B6/B7"), (2008, 2015, "B8"), (2015, 2023, "B9")],
        "A6": [(2004, 2011, "C6"), (2011, 2018, "C7"), (2018, 2025, "C8")],
        "Q5": [(2008, 2017, "8R"), (2017, 2025, "FY")],
    },
    "Fiat": {
        "Punto": [(1999, 2010, "188"), (2005, 2018, "199")],
        "Panda": [(2003, 2012, "169"), (2012, 2025, "312")],
        "500": [(2007, 2025, "312")],
    },
    "Opel": {
        "Astra": [(2004, 2009, "H"), (2009, 2015, "J"), (2015, 2021, "K")],
        "Corsa": [(2000, 2006, "C"), (2006, 2014, "D"), (2014, 2019, "E"), (2019, 2025, "F")],
        "Insignia": [(2008, 2017, "A"), (2017, 2025, "B")],
    },
    "Ford": {
        "Focus": [(2004, 2011, "Mk2"), (2011, 2018, "Mk3"), (2018, 2025, "Mk4")],
        "Fiesta": [(2002, 2008, "Mk6"), (2008, 2017, "Mk7"), (2017, 2023, "Mk8")],
        "Mondeo": [(2007, 2014, "Mk4"), (2014, 2022, "Mk5")],
    },
    "Peugeot": {
        "206": [(1998, 2012, None)],
        "207": [(2006, 2014, None)],
        "308": [(2007, 2013, "T7"), (2013, 2021, "T9")],
        "3008": [(2009, 2016, None), (2016, 2025, "P84")],
    },
    "Renault": {
        "Clio": [(2005, 2012, "III"), (2012, 2019, "IV"), (2019, 2025, "V")],
        "Megane": [(2002, 2008, "II"), (2008, 2016, "III"), (2016, 2023, "IV")],
        "Scenic": [(2003, 2009, "II"), (2009, 2016, "III")],
    },
    "Hyundai": {
        "i20": [(2008, 2014, "PB"), (2014, 2020, "GB"), (2020, 2025, "BC3")],
        "i30": [(2007, 2012, "FD"), (2012, 2017, "GD"), (2017, 2025, "PD")],
        "Tucson": [(2004, 2010, "JM"), (2010, 2015, "LM"), (2015, 2020, "TL")],
    },
    "Kia": {
        "Ceed": [(2006, 2012, "ED"), (2012, 2018, "JD"), (2018, 2025, "CD")],
        "Sportage": [(2004, 2010, "JE"), (2010, 2015, "SL"), (2015, 2021, "QL")],
        "Rio": [(2005, 2011, "JB"), (2011, 2017, "UB"), (2017, 2025, "YB")],
    },
    "Nissan": {
        "Qashqai": [(2006, 2013, "J10"), (2013, 2021, "J11"), (2021, 2025, "J12")],
        "Micra": [(2003, 2010, "K12"), (2010, 2017, "K13"), (2017, 2025, "K14")],
        "Juke": [(2010, 2019, "F15"), (2019, 2025, "F16")],
    },
    "Skoda": {
        "Octavia": [(2004, 2013, "1Z"), (2013, 2020, "5E"), (2020, 2025, "NX")],
        "Fabia": [(2000, 2007, "6Y"), (2007, 2014, "5J"), (2014, 2021, "NJ")],
        "Superb": [(2008, 2015, "3T"), (2015, 2024, "3V")],
    },
    "Seat": {
        "Ibiza": [(2002, 2008, "6L"), (2008, 2017, "6J"), (2017, 2025, "KJ1")],
        "Leon": [(2005, 2012, "1P"), (2012, 2020, "5F"), (2020, 2025, "KL")],
        "Arona": [(2017, 2025, None)],
    },
}

CATEGORIES: list[tuple[str, str, list[tuple[str, str]]]] = [
    ("Engine", "engine", [
        ("Engine Block", "engine-block"),
        ("Turbo", "turbo"),
        ("Alternator", "alternator"),
        ("Starter Motor", "starter-motor"),
        ("Fuel Injector", "fuel-injector"),
    ]),
    ("Transmission", "transmission", [
        ("Gearbox", "gearbox"),
        ("Clutch", "clutch"),
        ("Driveshaft", "driveshaft"),
    ]),
    ("Body", "body", [
        ("Door", "door"),
        ("Bumper", "bumper"),
        ("Fender", "fender"),
        ("Hood", "hood"),
        ("Mirror", "mirror"),
    ]),
    ("Electrical", "electrical", [
        ("Headlight", "headlight"),
        ("Tail Light", "tail-light"),
        ("ECU", "ecu"),
        ("Wiring Harness", "wiring-harness"),
    ]),
    ("Suspension", "suspension", [
        ("Shock Absorber", "shock-absorber"),
        ("Control Arm", "control-arm"),
        ("Spring", "spring"),
    ]),
    ("Interior", "interior", [
        ("Seat", "seat"),
        ("Dashboard", "dashboard"),
        ("Steering Wheel", "steering-wheel"),
    ]),
    ("Brakes", "brakes", [
        ("Brake Disc", "brake-disc"),
        ("Brake Caliper", "brake-caliper"),
        ("Brake Pad", "brake-pad"),
    ]),
    ("Cooling", "cooling", [
        ("Radiator", "radiator"),
        ("Water Pump", "water-pump"),
        ("Thermostat", "thermostat"),
    ]),
    ("Exhaust", "exhaust", [
        ("Catalytic Converter", "catalytic-converter"),
        ("Muffler", "muffler"),
        ("Exhaust Manifold", "exhaust-manifold"),
    ]),
    ("Steering", "steering", [
        ("Power Steering Pump", "power-steering-pump"),
        ("Steering Rack", "steering-rack"),
        ("Tie Rod", "tie-rod"),
    ]),
]


def seed() -> None:
    init_db()

    with Session(engine) as session:
        existing = session.exec(select(Make)).first()
        if existing:
            print("Database already seeded, skipping.")
            return

        # Seed makes, models, model_years
        for make_name, models in VEHICLES.items():
            make = Make(name=make_name)
            session.add(make)
            session.flush()

            for model_name, years in models.items():
                model = Model(make_id=make.id, name=model_name)  # type: ignore[arg-type]
                session.add(model)
                session.flush()

                for year_start, year_end, generation in years:
                    model_year = ModelYear(
                        model_id=model.id,  # type: ignore[arg-type]
                        year_start=year_start,
                        year_end=year_end,
                        generation=generation,
                    )
                    session.add(model_year)

        # Seed categories
        for cat_name, cat_slug, subcats in CATEGORIES:
            category = PartCategory(name=cat_name, slug=cat_slug)
            session.add(category)
            session.flush()

            for sub_name, sub_slug in subcats:
                subcategory = PartCategory(name=sub_name, slug=sub_slug, parent_id=category.id)
                session.add(subcategory)

        session.commit()
        print("Seed data inserted successfully.")


if __name__ == "__main__":
    seed()
