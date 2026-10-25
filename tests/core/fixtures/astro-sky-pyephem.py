# Reference rows for tests/core/astro-sky.test.js: sun and moon from PyEphem
# (no refraction: pressure 0) at 50 seeded random times (2020 to 2032) and
# places. Regenerate: pip install ephem; python3 astro-sky-pyephem.py > astro-sky-pyephem.json
import json, math, random, datetime, ephem
random.seed(2026)
rows = []
for _ in range(50):
    t = datetime.datetime(2020, 1, 1) + datetime.timedelta(seconds=random.random() * 12 * 365.25 * 86400)
    lat, lon = random.uniform(-65, 65), random.uniform(-180, 180)
    o = ephem.Observer(); o.lat = str(lat); o.lon = str(lon); o.pressure = 0; o.elevation = 0; o.date = t
    s, m = ephem.Sun(o), ephem.Moon(o)
    rows.append({
        't': int(t.replace(tzinfo=datetime.timezone.utc).timestamp() * 1000), 'lat': round(lat, 4), 'lon': round(lon, 4),
        'sun': [round(math.degrees(s.az), 4), round(math.degrees(s.alt), 4)],
        'moon': [round(math.degrees(m.az), 4), round(math.degrees(m.alt), 4), round(m.moon_phase, 4)]
    })
print(json.dumps(rows, indent=0))
