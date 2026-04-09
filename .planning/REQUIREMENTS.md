# Requirements: MOAR

**Defined:** 2026-04-08
**Core Value:** Every set logged gives immediate feedback, and every workout shows visible progress

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Logging

- [x] **LOG-01**: User can log a set with weight and reps in 1-3 taps
- [x] **LOG-02**: Weight and reps pre-filled from last session's values as default
- [x] **LOG-03**: Stepper buttons (+/-) for adjusting weight and reps without keyboard
- [x] **LOG-04**: Every set silently timestamped for future rest/order analysis
- [x] **LOG-05**: User can edit or delete a logged set
- [x] **LOG-06**: Card-based active workout screen for jumping between exercises freely

### Workouts

- [ ] **WRK-01**: User can create named workouts ("Full Body", "Push Day")
- [ ] **WRK-02**: User can repeat last workout with one tap (loads previous exercises + numbers)
- [ ] **WRK-03**: Templates auto-update when workout is modified (living templates)
- [ ] **WRK-04**: User can add exercises mid-workout with freeform entry and autocomplete
- [ ] **WRK-05**: User can start a new empty workout and name it
- [ ] **WRK-06**: Active workout recovers on app reload (no data loss mid-workout)

### Feedback

- [ ] **FBK-01**: Per-set micro-feedback badges (PR, +1, matched, volume up, comeback)
- [ ] **FBK-02**: Post-workout summary with volume comparison, win count, highlights
- [ ] **FBK-03**: Progressive overload nudges ("try +1 rep" or "+5 lbs")
- [ ] **FBK-04**: Per-exercise volume-over-time line chart
- [ ] **FBK-05**: Total workout volume-over-time line chart

### History

- [ ] **HST-01**: View list of past workouts (date, name, total volume)
- [ ] **HST-02**: View exercise history across all workouts
- [ ] **HST-03**: View workout detail (exercises, sets, volume)

### Platform

- [x] **PLT-01**: Mobile-first responsive design (works on iPhone Safari)
- [x] **PLT-02**: Local storage with IndexedDB (works offline)
- [ ] **PLT-03**: PWA-capable (add to home screen)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Intelligence

- **INT-01**: LLM-powered workout recap and natural language Q&A on history
- **INT-02**: Pattern detection summaries (time of day, exercise order, rest time correlations)
- **INT-03**: Adaptive nudge tone based on context (streak vs comeback vs plateau)

### Data

- **DAT-01**: Cloud sync for cross-device access
- **DAT-02**: Data export (JSON/CSV backup)
- **DAT-03**: Exercise merge utility (combine duplicate exercise names)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Social features / sharing | Personal tool, no audience |
| AI workout programming | "Do just a little more" is the only program needed |
| Body measurements / photos | Different domain, adds clutter |
| Calorie / nutrition tracking | Completely different product |
| Complex periodization | Over-engineering for a 3x/week lifter |
| Exercise video tutorials | Content maintenance burden |
| Rest timer with alarm UI | Passive timestamps capture this without friction |
| Mandatory exercise library | Freeform entry is faster for personal use |
| Achievement badges / gamification | Volume chart IS the gamification |
| Multi-user / authentication | Single user, local storage |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLT-01 | Phase 1: Foundation | Complete |
| PLT-02 | Phase 1: Foundation | Complete |
| LOG-01 | Phase 2: Core Logging | Complete |
| LOG-02 | Phase 2: Core Logging | Complete |
| LOG-03 | Phase 2: Core Logging | Complete |
| LOG-04 | Phase 2: Core Logging | Complete |
| LOG-05 | Phase 2: Core Logging | Complete |
| LOG-06 | Phase 2: Core Logging | Complete |
| WRK-01 | Phase 3: Workouts & Templates | Pending |
| WRK-02 | Phase 3: Workouts & Templates | Pending |
| WRK-03 | Phase 3: Workouts & Templates | Pending |
| WRK-04 | Phase 3: Workouts & Templates | Pending |
| WRK-05 | Phase 3: Workouts & Templates | Pending |
| WRK-06 | Phase 3: Workouts & Templates | Pending |
| FBK-01 | Phase 4: Feedback & Comparison | Pending |
| FBK-02 | Phase 4: Feedback & Comparison | Pending |
| FBK-03 | Phase 4: Feedback & Comparison | Pending |
| HST-01 | Phase 5: History & Charts | Pending |
| HST-02 | Phase 5: History & Charts | Pending |
| HST-03 | Phase 5: History & Charts | Pending |
| FBK-04 | Phase 5: History & Charts | Pending |
| FBK-05 | Phase 5: History & Charts | Pending |
| PLT-03 | Phase 6: PWA Polish | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
