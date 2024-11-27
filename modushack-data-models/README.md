# ModusHack Livestream #2: Data and Models

This example shows how to fetch the most recent articles from the New York Times API and use the Meta LLama LLM model to copywrite additional article titles based on the description.

Watch the recording here:

[![ModusHack Livestream: Data and Models](https://img.youtube.com/vi/gB-v7YWwkCw/0.jpg)](https://www.youtube.com/watch?v=gB-v7YWwkCw&list=PLzOEKEHv-5e3zgRGzDysyUm8KQklHQQgi&index=3)

## To run

Ensure you have the `modus` cli installed:

```
npm i -g @hypermode/modus-cli
```

Then to build and run the Modus app locally:

```
modus dev
```

To use the Meta LLama model hosted on Hypermode you'll need a free Hypermode account.

First install the `hyp` cli:

```
npm install -g @hypermode/hyp-cli
```

Then login to Hypermode:

```
hyp login
```

You'll be prompted to login / create a Hypermode account after which you'll be able to invokve Hypermode hosted models via your Modus apps locally.