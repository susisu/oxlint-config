# @susisu/oxlint-config

[![CI](https://github.com/susisu/oxlint-config/actions/workflows/ci.yml/badge.svg)](https://github.com/susisu/oxlint-config/actions/workflows/ci.yml)

## Requirements

- oxlint >= 1.86.0

## Installation

```shell
npm i -D oxlint @susisu/oxlint-config
```

## Usage

In `oxlint.config.ts`:

```ts
import { config } from "@susisu/oxlint-config";

export default config({
  // Your oxlint config goes here
  options: {
    typeAware: true,
    reportUnusedDisableDirectives: "warn",
  },
  categories: {
    correctness: "error",
  },
});
```

## License

[MIT License](https://opensource.org/licenses/MIT)

## Author

Susisu ([GitHub](https://github.com/susisu), [X (Twitter)](https://x.com/susisu2413))
