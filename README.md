# tracker-music-player

Simple implementation of Protracker spec

## Features

- loop sample once
- loop sample forever
- orchestrate 8 channels
- set default sample volume

## API

- `Sample` - represents channel unit. Requires `Streamer`
- `Streamer` - represents external player where the sound is piped to
- `Channel` - represents single channel. Requires `samples` array of `Sample`
- `Song` - marshals the `Channel` objects

## Supports

- 8CHN

## API

```js
const song = new Song(readFileSync("./path/to/module.mod"));
await song.play();
```

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
npm test -- --manual --song --sample
```
