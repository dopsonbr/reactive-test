# dashboards.yml

## Purpose

Configures Grafana's dashboard provisioning system. This file tells Grafana where to find dashboard JSON files and how to organize them.

## Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `name` | default | Provider identifier |
| `folder` | Reactive Test | Folder name in Grafana UI |
| `type` | file | Load dashboards from filesystem |
| `disableDeletion` | false | Allows deleting provisioned dashboards |
| `editable` | true | Allows editing dashboards in UI |
| `path` | /etc/grafana/provisioning/dashboards | Dashboard JSON location |

## How It Works

1. On Grafana startup, this file is read from `/etc/grafana/provisioning/dashboards/`
2. Grafana scans `path` for JSON dashboard files
3. Dashboards are loaded into the "Reactive Test" folder
4. Changes made in UI persist until container restart

## Dashboard Location

Place dashboard JSON files in:
```
docker/grafana/provisioning/dashboards/*.json
```

These are mounted into the container at `/etc/grafana/provisioning/dashboards/`.

## Why These Settings

- **editable: true** - Allows experimentation in local development
- **disableDeletion: false** - Clean up unwanted dashboards
- **file provider** - Simple approach for version-controlled dashboards
- **Named folder** - Organizes project dashboards separately from defaults

## Adding New Dashboards

1. Create/export a dashboard in Grafana
2. Save JSON to `docker/grafana/provisioning/dashboards/`
3. Restart Grafana or wait for auto-reload

Dashboard UIDs in JSON must be unique across all provisioned dashboards.
