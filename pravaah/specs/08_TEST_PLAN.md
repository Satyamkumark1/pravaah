# PRAVAAH — TEST PLAN

## Test pyramid

1. pure unit tests
2. component tests
3. contract/integration tests
4. end-to-end tests
5. manual demo rehearsal

## Engine unit tests

### Feature tests
- density normalization
- velocity calculation
- pressure calculation
- entropy calculation
- normalization edge cases

### Classifier tests
- clear flowing sample -> FLOWING
- moderate instability -> STOP_AND_GO
- severe instability -> TURBULENT
- boundary thresholds are deterministic

### Hysteresis tests
- one-frame spikes do not change state
- state changes only after hold duration
- recovery does not flicker
- candidate state can be cancelled

## Simulator tests

- every scenario loads
- every scenario is deterministic for same seed
- expected regime sequence is produced
- warning window appears at expected interval

## API tests

- health endpoint
- camera list
- incident list
- simulator start/stop
- validation errors
- event schema

## WebSocket tests

- client can connect
- heartbeat/state events arrive
- event versions are correct
- reconnect does not create duplicate subscriptions
- invalid message does not crash server

## Dashboard tests

- routes render
- loading states render
- empty states render
- errors render
- regime color/status labels match typed state
- simulator controls work
- charts receive event data

## E2E acceptance

### Demo flow

1. open `/simulator`
2. select `festival_gate`
3. press START DEMO
4. observe FLOWING
5. observe STOP_AND_GO
6. observe WARNING WINDOW
7. observe TURBULENT
8. observe alert panel
9. reset
10. replay produces the same sequence

## Visual QA checklist

- no text overlap
- no clipped cards
- no broken icons
- readable at 1280px width
- consistent state colors
- no accidental giant scrollbars
- no console errors

## Performance targets for prototype

- dashboard initial route interactive quickly on a normal laptop
- UI remains responsive during simulator animation
- charts must not cause frame drops
- keep WebSocket update rendering throttled/batched if necessary
