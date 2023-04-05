document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.join-waitlist').addEventListener('click', () => {
    document.querySelector('.waitlist-join-wrapper').style.transform =
      'scale(1) translate(-50%, -50%)';
  });

  document.querySelector('.remove').addEventListener('click', () => {
    document.querySelector('.waitlist-join-wrapper').style.transform =
      'scale(0)';
  });

  document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const email = document.querySelector('.email');
    addToWaitlist(email.value);
  });
});

const addToWaitlist = (email) => {
  const waitlist = document.querySelector('.waitlist-content');

  const submitBtn = document.querySelector('.submit-form');
  submitBtn.value = 'Joining...';
  submitBtn.disabled = true;

  fetch(`waitlist/join?email=${email}`)
    .then((response) => {
      switch (response.status) {
        case 200:
          waitlist.innerHTML =
            "Thank you for joining our waitlist! We appreciate your interest in our upcoming launch, and we look forward to sharing more information with you soon. As a valued member of our waitlist, you'll be among the first to hear about our progress and updates. Stay tuned for exciting news!";
          break;

        case 409:
          waitlist.innerHTML =
            "Thank you for your interest in joining our waitlist! However, it looks like the email address you provided is already on our list. You don't need to take any further action, and we'll be sure to keep you informed of any updates regarding our launch. Thank you for your continued support!";
          break;

        default:
          waitlist.innerHTML =
            "Sorry, we couldn't add you to our waitlist at this time. Please try again later or contact our support team for assistance. We apologize for the inconvenience and appreciate your interest in our service. Thank you for your patience and understanding.";
          break;
      }
    })
    .catch((error) => console.error(error));
};
