# PRAVAAH — HACKATHON DEMO RUNBOOK

## Before presentation

- [ ] Laptop plugged in.
- [ ] Demo browser tab preloaded.
- [ ] Simulator data available locally.
- [ ] Backend started and health checked.
- [ ] Dashboard opened at Overview.
- [ ] Camera 03 / Festival Gate scenario ready.
- [ ] Network disconnect tested if demonstrating offline capability.

## 60-second narrative

### 0–10 sec
Show crowded CCTV view.

Say:

> Dense does not mean dangerous.

### 10–20 sec
Switch to movement overlay.

Say:

> We measure whether the crowd is still moving coherently.

### 20–35 sec
Start simulator.

Show:

FLOWING -> STOP_AND_GO

Say:

> Stop-and-go is the warning window.

### 35–45 sec
Show warning panel.

### 45–55 sec
Transition toward TURBULENT.

### 55–60 sec
Show architecture/privacy/edge state.

Close with:

> We do not need to know who is in the crowd. We need to know when the crowd stops moving coherently.

## Backup demo

If backend fails:
- use local deterministic simulator-only mode
- do not invent a live connection
- clearly present it as a simulation

## Hard questions to pre-answer

### Does Pravaah use face recognition?
No.

### Does footage leave the venue?
Not in the intended edge deployment. Critical processing is local.

### Is this guaranteed to predict a crush?
No. It is a risk-indication and early-warning system.

### Why not just use density?
Density alone produces false alarms because many dense crowds are stable.

### Why is stop-and-go important?
It is the designed prototype warning state representing emerging movement instability before turbulence.
