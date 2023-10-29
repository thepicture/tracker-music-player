# tracker-music-player

Simple implementation of Protracker spec

## Features

- loop sample once
- loop sample forever
- orchestrate 8 channels
- set default sample volume

## API

- `Sample` - represents channel's unit
- `Channel` - represents single channel. Requires `samples` array of `Sample`. Has external player where the sound is piped to
- `Song` - marshals the `Channel` objects

## Supports

- 8CHN

## API

```js
const song = new Song(readFileSync("./path/to/module.mod"));
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
