sauth-twitter
=============

Twitter [sauth](https://github.com/jwerle/sauth) strategy

## install

```sh
$ npm i sauth-twitter
```

## usage

Command line arguments:

```sh
$ sauth twitter \
  --consumer-key=CONSUMER_KEY \
  --consumer-secret=CONSUMER_SECRET \
  [--redirect-uri=REDIRECT_URI|--out-of-bound|-oob] \
```

Possible JSON configuration:

```sh
$ sauth twitter -c conf.json
```

conf.json

```json
{
  "consumer_key": "CONSUMER_KEY",
  "consumer_secret": "CONSUMER_SECRET",
  "redirect_uri": "REDIRECT_URI",
  "port": 9999,
  "oob": true
}
```

## license

MIT
