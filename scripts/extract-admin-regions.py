import json
import re
from pathlib import Path
import openpyxl

def fix(s):
    if s is None:
        return None
    s = str(s).strip().replace("\n", "")
    s = s.replace("\u0398", "e").replace("\u039e", "e").replace("\u2229", "i")
    s = re.sub(r"\s+", " ", s)
    return s

wb = openpyxl.load_workbook(
    r"c:\Users\Admin\Downloads\Decoupage Administratif_RCA.xlsx", read_only=True
)
ws = wb.active
rows = []
last_rn = None
last_health = None
for row in ws.iter_rows(min_row=2, values_only=True):
    rn, health, admin, pref = row[0], row[1], row[2], row[3]
    if rn is not None:
        last_rn = int(rn)
    if health is not None:
        last_health = fix(health)
    admin = fix(admin)
    pref = fix(pref)
    if not admin or not pref:
        continue
    rows.append(
        {
            "region_number": last_rn,
            "health_region": last_health,
            "admin_region": admin,
            "prefecture": pref,
        }
    )

regions = {}
order = []
for r in rows:
    key = (r["admin_region"], r["health_region"])
    if key not in regions:
        regions[key] = {
            "admin_region": r["admin_region"],
            "health_region": r["health_region"],
            "prefectures": [],
        }
        order.append(key)
    if r["prefecture"] not in regions[key]["prefectures"]:
        regions[key]["prefectures"].append(r["prefecture"])

out = []
for i, key in enumerate(order, start=1):
    item = regions[key]
    item["code"] = f"R{i}"
    out.append(item)

out_path = Path(__file__).parent / "admin-region-map.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

for item in out:
    print(item["code"], item["admin_region"], "|", item["health_region"], "|", item["prefectures"])
print("total", len(out))
