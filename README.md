# RingCentral Embeddable Voice with Electron

Build a RingCentral desktop app with [RingCentral Embeddable Voice](https://github.com/ringcentral/ringcentral-embeddable-voice) and [Electron.js](https://electronjs.org)

![image](https://user-images.githubusercontent.com/7036536/40214179-e8dbdd6a-5a8b-11e8-9a20-6ca56f930ef6.png)

## Development

### Prerequisites

* Install Node.js with version >= 8
* Install NPM or Yarn

### Setup

Clone this repo:

```
$ git clone https://github.com/embbnux/ringcentral-embeddable-voice-app.git
$ cd ringcentral-embeddable-voice-app
$ yarn
$ yarn start
```

### Build package

To build package for current system

```
yarn package
```

To build a Linux package(deb, AppImage)

```
yarn package-linux
```

To build for all

```
yarn package-all
```
