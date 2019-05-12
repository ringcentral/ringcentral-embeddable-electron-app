const { ipcRenderer } = require('electron');

window.addEventListener('message', function (event) {
  const data = event.data;
  if (!data) {
    return;
  }
  let notification;
  switch (data.type) {
    case 'rc-call-ring-notify':
      // get call on ring event
      ipcRenderer.send('show-main-window');
      const call = data.call;
      notification = new Notification('New Call', {
        body: `Incoming Call from ${call.fromUserName || call.from}`
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
      // notification.onclose = () => {
      //   dispatchMessage({
      //     type: 'rc-adapter-control-call',
      //     callAction: 'reject',
      //     callId: call.id,
      //   });
      // }
      break;
    case 'rc-inbound-message-notify':
      const message = data.message;
      notification = new Notification('New Message', {
        body: `Message from: ${message.from && (message.from.phoneNumber || message.from.extensionNumber)}`,
      });
      notification.onclick = () => {
        ipcRenderer.send('show-main-window');
      };
      break
    default:
      break;
  }
});
