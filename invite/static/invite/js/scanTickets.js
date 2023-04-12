document.addEventListener('DOMContentLoaded', () => {
  let scanner = new Instascan.Scanner({ video: document.getElementById('scanner') });

  scanner.addListener('scan', async (content) => {
    // This function will be called when a QR code is scanned
    console.log(content);

    const scanner = document.querySelector('#scanner');
    scanner.classList.add('d-none');

    const eventId = document.querySelector('.event-id').textContent;
    try {
      const response = await fetch(`/ticket/scan/${eventId}/${content}`);

      const container = document.createElement('div');
      container.className = 'scan-results';
      const scannerContainer = document.querySelector('.tickets-scanner');               
      switch (response.status) {
        case 200:
          const { ticket } = await response.json();
          const ticketGroupCount = parseInt(ticket.people);

          container.innerHTML = `
            <div class='mb3'>Ticket is Valid</div>
            <div class='mb3'>Belongs to ${ticket.owner} ${count > 1 ? `and ${ticketGroupCount} other(s).` : ''}</div>
            <button class='btn btn-secondary return-scan'>Scan another ticket</button>
          `;
          scannerContainer.style.backgroundColor = 'green';
          break;

        case 400:
          container.innerHTML = `
            <div class='mb-3>Ticket is Invalid</div>
            <button class='btn btn-secondary return-scan'>Scan another ticket</button>
          `;
          scannerContainer.style.backgroundColor = 'red';
          break;

        case 410:
          container.innerHTML = `
            <div class='mb-3>Ticket Expired</div>
            <button class='btn btn-secondary return-scan'>Scan another ticket</button>
          `;
          scannerContainer.style.backgroundColor = 'orange';
          break;
      }

      scannerContainer.appendChild(container);
      document.querySelector('.return-scan').addEventListener('click', () => {
        container.remove();
        scanner.classList.remove('d-none');
        scannerContainer.style.backgroundColor = 'white';
      });
      

    } catch (error) {
      alert('An error occurred while scanning this ticket, please check your internet connection and try again later.');
      console.error(error);
    }
  });


  Instascan.Camera.getCameras().then(function (cameras) {
    if (cameras.length > 0) {
        scanner.start(cameras[0]);
    } else {
        console.error('No cameras found.');
    }
  }).catch(function (e) {
      console.error(e);
  });
})