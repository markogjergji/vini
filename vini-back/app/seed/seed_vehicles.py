from sqlmodel import Session, select

from app.database import engine, init_db
from app.models.part import PartCategory

# (emri, slug, ikona, nënkategori: list[(emri, slug)])
CATEGORIES: list[tuple[str, str, str, list[tuple[str, str]]]] = [
    ("Motori", "engine", "🔩", [
        ("Blloku i Motorit & Brendësia", "engine-block"),
        ("Kokat e Cilindrave & Valvolat", "cylinder-heads"),
        ("Komponentët e Sinkronizimit", "timing-components"),
        ("Guarnicionet & Sigillimet", "gaskets-seals"),
        ("Turbokompresori & Superkompresori", "turbocharger"),
        ("Injektorët e Karburantit & Tubacionet", "fuel-injectors"),
        ("Kolektori i Hyrjes", "intake-manifold"),
        ("Sensorët e Motorit", "engine-sensors"),
    ]),
    ("Transmisioni & Tërheqja", "transmission", "⚙️", [
        ("Transmisioni Manual", "manual-transmission"),
        ("Transmisioni Automatik", "automatic-transmission"),
        ("Friksioni & Volani i Inercisë", "clutch-flywheel"),
        ("Boshti i Lëvizjes & Akselet CV", "driveshaft-cv"),
        ("Diferencial", "differential"),
        ("Kutia e Transferimit", "transfer-case"),
    ]),
    ("Frenat", "brakes", "🛑", [
        ("Pastilat & Feratat e Frenave", "brake-pads"),
        ("Disqet & Tamburët e Frenave", "brake-discs"),
        ("Kapëset e Frenave", "brake-calipers"),
        ("Tubat & Zorrët e Frenave", "brake-lines"),
        ("Cilindri Kryesor & Amplifikuesi", "brake-master-cylinder"),
        ("Frena e Dorës", "handbrake"),
    ]),
    ("Susta & Drejtimi", "suspension", "🔧", [
        ("Amortizatorët & Stutat", "shock-absorbers"),
        ("Spiralet & Koiloverët", "springs-coilovers"),
        ("Krahët e Kontrollit & Bukshinat", "control-arms"),
        ("Kyçet Sferike & Shufrat e Lidhjes", "ball-joints"),
        ("Raka e Drejtimit & Pompa", "steering-rack"),
        ("Kushineta & Busat e Rrotave", "wheel-bearings"),
    ]),
    ("Elektrika & Ndezja", "electrical", "⚡", [
        ("ECU / Njësia e Kontrollit të Motorit", "ecu"),
        ("Alternatori & Starteri", "alternator-starter"),
        ("Bobina & Kandelet", "ignition"),
        ("Fashat Elektrike", "wiring-harnesses"),
        ("Siguricat & Relevet", "fuses-relays"),
        ("Sensorët", "sensors"),
        ("Bateria & Karikimi", "battery"),
    ]),
    ("Ndriçimi", "lighting", "💡", [
        ("Farat e Përparme", "headlights"),
        ("Farat e Pasme", "tail-lights"),
        ("Farat e Mjegullës", "fog-lights"),
        ("Ndriçimi i Brendshëm", "interior-lighting"),
        ("Sinjalet e Kthesës", "indicators"),
    ]),
    ("Karoseria & Jashtësia", "body", "🚗", [
        ("Paragocilet & Fashat", "bumpers"),
        ("Kapota", "hoods"),
        ("Dyert & Panelet", "doors-panels"),
        ("Parafangot & Panelet Anësore", "fenders"),
        ("Pasqyrat", "mirrors"),
        ("Grilat", "grilles"),
        ("Spoilerët & Krahët", "spoilers"),
        ("Xhamat & Xhami i Përparmë", "glass"),
    ]),
    ("Brendësia", "interior", "🪑", [
        ("Ndenjëset & Tapiceria", "seats"),
        ("Paneli i Instrumenteve & Dekoracioni", "dashboard"),
        ("Volani", "steering-wheel"),
        ("Pedalat & Mbajtëset e Këmbës", "pedals"),
        ("Konsola & Hapësirat Ruajtëse", "console"),
        ("Matëset & Instrumentet", "gauges"),
        ("Izolimi Akustik", "sound-deadening"),
    ]),
    ("Ftohja & Ngrohja", "cooling", "🌡️", [
        ("Radiatori", "radiator"),
        ("Pompa e Ujit", "water-pump"),
        ("Termostati", "thermostat"),
        ("Ventilatori i Ftohjes & Mbulesë", "cooling-fan"),
        ("Nxehësi Brendshëm", "heater-core"),
        ("Interkuleri", "intercooler"),
    ]),
    ("Egzausti", "exhaust", "💨", [
        ("Kolektori i Egzaustit", "exhaust-manifold"),
        ("Katalizatori", "catalytic-converter"),
        ("Tubi i Mesëm & Downpipe", "downpipe"),
        ("Heshtësi (Muffler)", "muffler"),
        ("Kapakët e Egzaustit", "exhaust-tips"),
    ]),
    ("Sistemi i Karburantit", "fuel-system", "⛽", [
        ("Pompa e Karburantit", "fuel-pump"),
        ("Deposita e Karburantit", "fuel-tank"),
        ("Filtri i Karburantit", "fuel-filter"),
        ("Karburantori", "carburettor"),
        ("Rregullatori i Presionit të Karburantit", "fuel-pressure-regulator"),
    ]),
    ("Marrja e Ajrit", "air-intake", "🌬️", [
        ("Filtri i Ajrit", "air-filter"),
        ("Marrja e Ajrit të Ftohtë", "cold-air-intake"),
        ("Trupi i Gazit", "throttle-body"),
        ("Sensori MAF", "maf-sensor"),
    ]),
    ("Rrotat & Gomat", "wheels-tyres", "🛞", [
        ("Felga Alumini", "alloy-wheels"),
        ("Felga Çeliku", "steel-wheels"),
        ("Gomat", "tyres"),
        ("Spacerët e Rrotave", "wheel-spacers"),
        ("Sensorët TPMS", "tpms"),
    ]),
    ("Performanca & Tuning", "performance", "🏎️", [
        ("Riprogramimi i ECU & Çipat", "ecu-remapping"),
        ("Kitet e Interkulerëve", "intercooler-kits"),
        ("Sistemet me Azot", "nitrous"),
        ("Levat e Shkurtra të Marsheve", "short-shifters"),
    ]),
    ("Aksesorë", "accessories", "🎒", [
        ("Teppicat e Dyshemesë", "floor-mats"),
        ("Mbulesat e Ndenjëseve", "seat-covers"),
        ("Shirja e Tërheqjes", "tow-bar"),
        ("Portbagazhët e Çatisë", "roof-racks"),
    ]),
    ("Pjesë të Lira & të Përdorura", "clearance", "🏷️", []),
]


def seed() -> None:
    init_db()

    with Session(engine) as session:
        if session.exec(select(PartCategory)).first():
            print("Kategoritë ekzistojnë, anashkalohet.")
            return

        for sort_idx, (cat_name, cat_slug, cat_icon, subcats) in enumerate(CATEGORIES):
            category = PartCategory(name=cat_name, slug=cat_slug, icon=cat_icon, sort_order=sort_idx * 10)
            session.add(category)
            session.flush()

            for sub_idx, (sub_name, sub_slug) in enumerate(subcats):
                subcategory = PartCategory(name=sub_name, slug=sub_slug, parent_id=category.id, sort_order=sub_idx * 10)
                session.add(subcategory)

        session.commit()
        print("Kategoritë u insertuan me sukses.")


if __name__ == "__main__":
    seed()
