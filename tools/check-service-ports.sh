#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: tools/check-service-ports.sh [-c docker/docker-compose.yml] [-e expected.json]

Checks for duplicate host ports in the docker-compose services section and optionally
validates against an expected service->port map (JSON). Exits non-zero on failures.

Options:
  -c FILE   Compose file to inspect (default: docker/docker-compose.yml)
  -e FILE   JSON expectation file; values may be numbers (host port) or
            objects { "host": <int>, "container": <int> }
  -h        Show this help
EOF
}

compose_file="docker/docker-compose.yml"
expected_file=""

while getopts ":c:e:h" opt; do
  case "$opt" in
    c) compose_file="$OPTARG" ;;
    e) expected_file="$OPTARG" ;;
    h) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

shift $((OPTIND - 1))

if [ $# -gt 0 ]; then
  usage
  exit 1
fi

if [ ! -f "$compose_file" ]; then
  echo "Compose file not found: $compose_file" >&2
  exit 1
fi

if [ -n "$expected_file" ] && [ ! -f "$expected_file" ]; then
  echo "Expected map not found: $expected_file" >&2
  exit 1
fi

python3 - "$compose_file" "$expected_file" <<'PY'
import json
import pathlib
import re
import sys
from typing import Dict, List

compose_path = pathlib.Path(sys.argv[1])
expected_arg = sys.argv[2]
expected_path = pathlib.Path(expected_arg) if expected_arg else None

text = compose_path.read_text().splitlines()

services: Dict[str, List[dict]] = {}
in_services = False
current = None
in_ports = False

for line in text:
    if not in_services:
        if re.match(r"^\s*services:\s*$", line):
            in_services = True
        continue

    if re.match(r"^\S", line):  # new root-level section
        break

    service_match = re.match(r"^\s{2}([^\s:#]+):\s*$", line)
    if service_match:
        current = service_match.group(1)
        services.setdefault(current, [])
        in_ports = False
        continue

    if current is None:
        continue

    if re.match(r"^\s{4}ports:\s*$", line):
        in_ports = True
        continue

    if re.match(r"^\s{4}\S", line):  # another top-level key within service
        in_ports = False

    if in_ports:
        port_match = re.match(r'^\s{6}-\s*"?(\d+):(\d+)"?\s*$', line)
        if port_match:
            services[current].append(
                {"host": int(port_match.group(1)), "container": int(port_match.group(2))}
            )

errors = []

host_to_services = {}
for svc, ports in services.items():
    for p in ports:
        host_to_services.setdefault(p["host"], []).append((svc, p["container"]))

duplicates = {h: v for h, v in host_to_services.items() if len(v) > 1}
if duplicates:
    errors.append("Duplicate host ports detected:")
    for host, entries in sorted(duplicates.items()):
        joined = ", ".join(f"{svc}->{host}:{container}" for svc, container in entries)
        errors.append(f"  {host}: {joined}")

if expected_path:
    expected = json.loads(expected_path.read_text())
    for svc, ports in services.items():
        if not ports:
            errors.append(f"{svc}: no ports mapped in compose")
            continue
        actual_host = ports[0]["host"]
        actual_container = ports[0]["container"]
        exp_entry = expected.get(svc)
        if exp_entry is None:
            errors.append(f"{svc}: missing expected entry in {expected_path}")
            continue
        if isinstance(exp_entry, dict):
            exp_host = exp_entry.get("host")
            exp_container = exp_entry.get("container")
        else:
            exp_host = exp_entry
            exp_container = None

        if exp_host is not None and exp_host != actual_host:
            errors.append(f"{svc}: host port {actual_host} != expected {exp_host}")
        if exp_container is not None and exp_container != actual_container:
            errors.append(f"{svc}: container port {actual_container} != expected {exp_container}")

    for svc in expected:
        if svc not in services:
            errors.append(f"Expected service {svc} not found in compose")

print("Discovered service→ports:")
for svc in sorted(services):
    ports = ", ".join(f"{p['host']}:{p['container']}" for p in services[svc]) or "none"
    print(f"  {svc}: {ports}")

if expected_path:
    print(f"\nCompared against expected: {expected_path}")

if errors:
    print("\nFailures:")
    for err in errors:
        print(f"- {err}")
    sys.exit(1)

print("\nOK: no duplicate host ports", end="")
if expected_path:
    print(" and expected mappings matched.")
else:
    print(".")
PY
