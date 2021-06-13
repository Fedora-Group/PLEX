'use strict';
const roomIdFromUrl = window.location.href;
const actualRoomId = roomIdFromUrl.split('/')[3];
const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: 'stun:us-turn8.xirsys.com',
    },
    {
      urls: 'turn:us-turn8.xirsys.com:3478?transport=tcp',
      credential: '731b5782-cc7e-11eb-ab6d-0242ac140004',
      username:
        's1bi50FzTpmu8sT4m1MA7uHObDZZkVpdTm6UlPre0aitRi0b3FniJoc8-jHzrOBrAAAAAGDGXedpYnJhaGltYmFuYXQ=',
      credentialType: 'password',
    },
  ],
};
console.log(window.location.origin);
const socket = io.connect(window.location.origin);

socket.emit('join-room', actualRoomId);
socket.on('answer', (id, description) => {
  console.log({ description });
  peerConnections[id].setRemoteDescription(description);
});

socket.on('watcher', id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  let stream = videoElement.srcObject;
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  };
  console.log({ peerConnection });

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit('offer', id, peerConnection.localDescription);
    });
});

socket.on('candidate', (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('disconnectPeer', id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector('video');
const audioSelect = document.querySelector('select#audioSource');
const videoSelect = document.querySelector('select#videoSource');

//fire event when the dropDown list changed.
audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream().then(getDevices).then(gotDevices);

function getDevices() {
  return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;
  for (const deviceInfo of deviceInfos) {
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
      audioSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
}

function getStream() {
  //getTracks: a sequence that represents all the MediaStreamTrack objects in this stream's
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const audioSource = audioSelect.value;
  const videoSource = videoSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {
  window.stream = stream;
  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );
  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );
  videoElement.srcObject = stream;
  socket.emit('broadcaster', { roomId: actualRoomId });
}

function handleError(error) {
  console.error('Error: ', error);
}
