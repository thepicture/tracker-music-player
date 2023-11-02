# tracker-music-player

Simple implementation of Protracker spec

## Features

- loop sample once
- loop sample forever
- orchestrate channels
- set default sample volume

## API

- `Sample` - represents channel's unit
- `Channel` - represents single channel. Requires `samples` array of `Sample`. Has external player where the sound is piped to
- `Song` - marshals the `Channel` objects

`enableAmigaPanning` - amiga emulation. `true` by default, assigns channels panning from left to right, consumes more processor time

## Supports

- 8CHN
- 4CHN
- M.K.
- CD81
- OKTA
- TDZ\*

## API

```js
const song = new Song(readFileSync("./path/to/module.mod"), {
  enableAmigaPanning: false,
});

await song.play();
```

### Events

`stop` - song stopped playing

## Controls

`1,2,...n, n = channel count` - toggle mute of the channel number

`u` - unmute all channels

`space` - toggle playing

`ctrl+c` - exit

## Test

```bash
npm test
```

Include manual test (sound warning)

```bash
npm test -- --manual --sample
```

```bash
npm test -- --manual --song
```

```bash
npm test -- --manual --song --channel --sample
```
