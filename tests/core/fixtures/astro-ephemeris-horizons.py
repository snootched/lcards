"""Reference vectors for tests/core/astro-ephemeris.test.js from JPL Horizons.

Run: python3 tests/core/fixtures/astro-ephemeris-horizons.py tests/core/fixtures/astro-ephemeris-horizons.json
Needs network access (ssd.jpl.nasa.gov). Planets and Ceres heliocentric, moons from their planet.
"""
import json, re, sys, time, urllib.parse, urllib.request
# [name, command, center]
BODIES = [
  ('mercury','199','500@10'),('venus','299','500@10'),('earth','399','500@10'),('mars','499','500@10'),
  ('jupiter','599','500@10'),('saturn','699','500@10'),('uranus','799','500@10'),('neptune','899','500@10'),
  ('pluto','999','500@10'),('ceres','1;','500@10'),
  ('moon','301','500@399'),('phobos','401','500@499'),('deimos','402','500@499'),
  ('io','501','500@599'),('europa','502','500@599'),('ganymede','503','500@599'),('callisto','504','500@599'),
  ('titan','606','500@699'),('triton','801','500@899'),('charon','901','500@999'),
]
JDS = [2433282.5, 2451545.0, 2461343.5, 2488069.5]
out = {'source': 'JPL Horizons, geometric vectors, ecliptic and mean equinox of J2000, km', 'jd_tdb': JDS, 'bodies': {}}
for name, cmd, center in BODIES:
    params = {'format':'text','COMMAND':f"'{cmd}'",'EPHEM_TYPE':"'VECTORS'",'CENTER':f"'{center}'",
              'TLIST':"'" + ' '.join(str(j) for j in JDS) + "'",'REF_PLANE':"'ECLIPTIC'",'REF_SYSTEM':"'ICRF'",
              'OUT_UNITS':"'KM-S'",'VEC_TABLE':"'1'",'CSV_FORMAT':"'YES'",'OBJ_DATA':"'NO'"}
    url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(params)
    txt = urllib.request.urlopen(url, timeout=60).read().decode()
    body = txt[txt.find('$$SOE')+5:txt.find('$$EOE')]
    rows = []
    for line in body.strip().splitlines():
        f = [x.strip() for x in line.split(',')]
        rows.append([round(float(f[2]),1), round(float(f[3]),1), round(float(f[4]),1)])
    if len(rows) != len(JDS): print('FAIL', name, txt[:2000], file=sys.stderr); sys.exit(1)
    out['bodies'][name] = {'center': center, 'xyz': rows}
    print(name, rows[1], file=sys.stderr)
    time.sleep(0.5)
json.dump(out, open(sys.argv[1], 'w'), indent=1)
