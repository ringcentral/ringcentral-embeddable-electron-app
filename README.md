# RingCentral Embeddable with Electron

Build a RingCentral desktop app with [RingCentral Embeddable](https://github.com/ringcentral/ringcentral-embeddable) and [Electron.js](https://electronjs.org)

![preview](https://user-images.githubusercontent.com/7036536/57593463-18891480-756e-11e9-80ed-16bd61655572.png)

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
