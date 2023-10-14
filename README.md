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

## Test

```bash
npm test
```
