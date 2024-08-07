# RingCentral Embeddable with Electron

Build a RingCentral desktop app with [RingCentral Embeddable](https://github.com/ringcentral/ringcentral-embeddable) and [Electron.js](https://electronjs.org)

![preview](https://github.com/user-attachments/assets/9e36768c-7c1c-4b1d-b242-f83a65b7a7fc)

## Usage

For Linux, install with snap:

```
$ sudo snap install ringcentral-embeddable-voice
$ sudo snap connect ringcentral-embeddable-voice:pulseaudio :pulseaudio
```

Or download installer files (AppImage, deb and snap) [here](https://github.com/ringcentral/ringcentral-embeddable-electron-app/releases).

## Development

### Prerequisites

* Install Node.js with version >= 16
* Install NPM or Yarn

### Setup

Clone this repo:

```
$ git clone https://github.com/ringcentral/ringcentral-embeddable-electron-app.git
$ cd ringcentral-embeddable-electron-app
$ yarn
```

Create `api.json` file in project root path:

```JSON
{
  "ringcentralClientId": "your_ringcentral_client_id",
  "ringcentralServer": "your_ringcentral_api_server, eg: https://platform.ringcentral.com"
}
```

Start app:

```
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
