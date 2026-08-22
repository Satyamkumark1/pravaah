# Pravaah Hackathon Presentation

Use this as a slide-by-slide deck, or paste it into a slide tool that accepts markdown.

---

## 1. Title

# PRAVAAH
## Real-Time Crowd Movement Intelligence and Crush Prevention

**Team Quartz Visualz**
- Satyam Kumar
- Ishika
- Manik

**Tagline:** Detect early. Act early. Prevent the crush.

**Speaker cue:** Open with the high-stakes problem: crowd safety failures happen fast, and operators need a warning before density turns into danger.

---

## 2. The Problem

### Why current crowd monitoring fails

- Most systems watch **density**
- Dense does not always mean dangerous
- Bad alerts create **alert fatigue**
- Real risk often starts with **movement breakdown**, not just crowd count

### Example

- Metro platforms can be dense and safe
- Temple queues can be packed and orderly
- Festival gates can become dangerous when flow turns unstable

**Speaker cue:** Make the contrast clear: the crowd itself is not the signal, the motion pattern is.

---

## 3. The Insight

### The real warning sign

Pravaah watches for the transition:

**FLOWING -> STOP-AND-GO -> TURBULENT**

- `FLOWING`: stable, coherent movement
- `STOP-AND-GO`: the warning window
- `TURBULENT`: critical risk

### Why this matters

- The warning window appears before full turbulence
- That gives operators time to intervene
- Actions can include gate control, diversion, and marshal deployment

**Speaker cue:** Emphasize that this is about buying time for human intervention.

---

## 4. Our Approach

### Fluid dynamics over counting

Instead of tracking people individually, Pravaah measures:

- Optical flow vectors
- Velocity variance
- Directional entropy
- Flow coherence
- Kinetic pressure proxy

### What we avoid

- Face detection
- Re-identification
- Identity tracking
- Cloud-dependent inference

**Speaker cue:** This is the technical differentiator. It is deterministic, privacy-first, and explainable.

---

## 5. How It Works

### Pipeline

1. CCTV frame input
2. Dense optical flow extraction
3. 8x8 grid partitioning
4. Feature computation per cell
5. Regime classification
6. Warning window estimation
7. Real-time dashboard + incidents

### Decision logic

- Low pressure + low entropy = `FLOWING`
- Medium disorder = `STOP_AND_GO`
- High pressure + high entropy = `TURBULENT`

**Speaker cue:** Keep this simple. The judges should understand the pipeline in one pass.

---

## 6. System Architecture

### What we built

- **Engine:** Python + FastAPI + OpenCV
- **Broadcast:** REST + WebSocket updates
- **Dashboard:** React + TypeScript + Tailwind
- **State:** live camera, incident, and metric tracking

### Deployment style

- Runs on existing CCTV feeds
- Works on local edge hardware
- No internet required for core operation

**Speaker cue:** Frame this as a practical edge-native product, not a research demo.

---

## 7. Live Dashboard

### What operators see

- Overview of active cameras
- Current regime per camera
- Active warnings and incidents
- Live monitoring wall
- Camera-level movement trends

### Why this helps

- Operators get an immediate triage view
- Critical cameras are visually obvious
- Alerts are tied to behavior, not just thresholds

**Speaker cue:** Point to the dashboard as the operational layer that makes the engine usable.

---

## 8. Privacy and Trust

### Built for safety without surveillance

- Zero facial recognition
- Zero personal identity tracking
- Zero demographic inference
- No cloud video storage required

### Why judges should care

- Easier to deploy in public infrastructure
- Better public acceptance
- Lower regulatory risk

**Speaker cue:** This is a strong differentiator for public spaces and smart-city use cases.

---

## 9. Demo Scenario

### Recommended live demo flow

1. Open the dashboard
2. Show a calm `FLOWING` camera
3. Switch to a `STOP_AND_GO` scenario
4. Highlight the warning window
5. Push into `TURBULENT`
6. Show incident creation and operator response

### Best demo locations

- Festival gate
- Metro platform
- Exit corridor
- Counter-flow zone

**Speaker cue:** The demo should show progression, not just screenshots.

---

## 10. Impact

### What Pravaah changes

- Moves detection earlier
- Reduces false positives from density-only systems
- Gives operators actionable time
- Improves safety without invasive surveillance

### Real-world applications

- Temples and pilgrimages
- Metro and railway platforms
- Stadium exits
- Festival and rally entry points

**Speaker cue:** Connect the technical solution to concrete public-safety scenarios.

---

## 11. Future Roadmap

### Next steps

- Better scenario calibration with more real footage
- Stronger incident analytics and reporting
- Broader camera-wall orchestration
- Automated response recommendations
- Hardware optimization for lower-cost edge devices

**Speaker cue:** Show that the system is a solid base, not a one-off hackathon prototype.

---

## 12. Closing

# Pravaah
## Detect early. Act early. Prevent the crush.

**One-line takeaway:** Crowd safety should be measured by motion instability, not just crowd size.

**Final speaker cue:** End on the human value proposition: earlier warning means fewer injuries and better decisions.

---

## Optional 90-second talk track

If you want a very short version:

> "Pravaah is a privacy-first crowd safety system that detects dangerous movement patterns before a crush happens. Most existing systems rely on density, but density alone creates false alarms and misses the real risk: the breakdown of coherent motion. We analyze optical flow, split the scene into grid cells, compute pressure and directional entropy, and classify the crowd into flowing, stop-and-go, or turbulent states. That gives operators a warning window to intervene before conditions become critical. The result is an explainable, edge-native system that works on existing CCTV infrastructure without facial recognition or cloud dependency."

