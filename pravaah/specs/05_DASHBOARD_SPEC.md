# PRAVAAH — DASHBOARD SPECIFICATION

## Routes

- `/` Overview
- `/live` Live Monitoring
- `/simulator` Simulator
- `/cameras` Cameras
- `/cameras/:id` Camera Detail
- `/incidents` Incidents
- `/analytics` Analytics
- `/system` System

## Global navigation

Sidebar:
- Overview
- Live Monitoring
- Simulator
- Cameras
- Incidents
- Analytics
- System

Header:
- site / venue name
- demo/live indicator
- edge node status
- clock

## Overview

KPI cards:
- Active Cameras
- Flowing
- Stop-and-Go
- Turbulent
- Active Alerts

Main panels:
- live crowd map
- camera status list
- active warning
- movement trend

## Live monitoring

2x2 or responsive camera wall.
Each card shows:
- camera id
- location
- live badge
- regime
- risk
- timestamp
- movement overlay

## Camera detail

Large video/visualization left.
Right-side state inspector.
Bottom trend charts.

## Simulator

This is the main demo page.
Required:
- scenario selector
- play/pause/reset
- timeline
- large crowd visualization
- active regime
- warning-window marker
- metrics
- recommended simulated actions

## Analytics

Charts:
- regime timeline
- pressure trend
- entropy trend
- velocity variance
- warning-window duration

## Incidents

Incident table with filters.
Clicking opens incident detail.

## System

Show:
- edge status
- processing status
- WebSocket
- update rate
- last heartbeat
- active scenario

## UX state requirements

Every async component needs:
- loading state
- empty state
- error state
- success/active state

## Accessibility

- keyboard navigation
- visible focus states
- sufficient text contrast
- color must never be the only way to identify a state
- tooltips/labels for icon-only controls
