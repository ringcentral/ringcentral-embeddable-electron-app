const { ipcRenderer } = require('electron');
const path = require('path');

console.log('preload...')

function dispatchMessage(data) {
  const message = new MessageEvent('message', {
    view: window.parent,
    bubbles: false,
    cancelable: false,
    data,
    source: window
  })
  window.dispatchEvent(message)
}

// mock main window post message
window.parent.postMessage = function (data) {
  dispatchMessage(data);
};

window.addEventListener('message', function (event) {
  const data = event.data;
  if (!data) {
    return;
  }
  switch (data.type) {
    case 'rc-call-ring-notify':
      // get call on ring event
      const call = data.call;
      const notification = new Notification('New Call', {
        body: `Incoming Call from ${call.fromUserName || call.from}`,
      });
      notification.onclick = () => {
        // answer the call directly
        // dispatchMessage({
        //   type: 'rc-adapter-control-call',
        //   callAction: 'answer',
        //   callId: call.id,
        // });
        ipcRenderer.send('show-main-window');
      };
      notification.onclose = () => {
        dispatchMessage({
          type: 'rc-adapter-control-call',
          callAction: 'reject',
          callId: call.id,
        });
      }
      break;
    default:
      break;
  }
});
