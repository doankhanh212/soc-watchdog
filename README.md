# Security SOC Platform

Security Operations Center – Threat Monitoring & Response

## Overview

A professional SOC analyst console for real-time security monitoring, threat detection, and incident response. Integrates with Wazuh Indexer API, Suricata IDS (eve.json), and MITRE ATT&CK framework.

## Modules

- **SOC Dashboard** – KPI overview and system health
- **Threat Monitoring** – Real-time threat feed and analysis
- **Incident Detection** – Active incident tracking and triage
- **Blocked IP Monitoring** – Firewall and IDS block lists
- **Suricata Alerts** – Network IDS alert stream
- **Wazuh Alerts** – Host-based IDS detections
- **MITRE ATT&CK Mapping** – Technique heatmap and coverage
- **Attack Timeline** – Temporal visualization of events
- **Threat Intelligence** – IOC feeds and enrichment
- **Automated Incident Response** – Playbook execution and automation

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Chart.js (react-chartjs-2)
- TanStack React Query

## Getting Started

```sh
npm install
npm run dev
```

The development server starts at `http://localhost:8080`.

## Build

```sh
npm run build
```
