<img width="100%" src="https://docs.cord.com/static/images/cord-sdk-banner.svg"></img>

# [cord-sdk](https://docs.cord.com/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/getcord/cli/blob/master/LICENSE)

A CLI tool to make it easy to interact with our [REST API](https://docs.cord.com/rest-apis) for manual exploration or automated changes.

# Install

1. install the package from npm:

```bash
npm i -g @cord-sdk/cli
```

2. Initialize Cord:

Run

```bash
cord init
```

This command will ask you for some credentials and add them to a `.cord` file within your home directory. To run any command (other than `cord application`) you will need the `CORD_APP_ID` and `CORD_APP_SECRET` of the application you would like to query within. These values can be found in the [console](https://console.cord.com/applications) under this application entry.

The `CORD_CUSTOMER_ID` and `CORD_CUSTOMER_SECRET` are only needed if you need app management commands, which you probably don't. If you do, they can be found in the [console](https://console.cord.com/applications), under `View application management credentials`.

If you already have a `.cord` file and would like to re-configure your variables, running `cord init` will default to the existing values.

<br/>

3. Start commanding!

Try out:

```bash
cord --help
```

to see what you can do!

# Usage & Documentation

Now that you have everything set up, you're good to go! Every REST endpoint has a corresponding command in the CLI tool.

You can run `--help` on any command to see what arguments it takes.

To see more information on how to interact with an endpoint, see our [docs](https://docs.cord.com/rest-apis) which contains detailed descriptions of every argument and return value.
