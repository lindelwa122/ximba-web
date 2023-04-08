document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.deposit').addEventListener('click', depositHandler);
  getWalletBalance();
});

const depositHandler = () => {
  addToMainModalHistory('Deposit', () => {
    const container = document.createElement('div');

    container.innerHTML = `
      <form class='deposit-form'>
        <div class='amount-container'>
          <div class='currency w-25'>R</div>
          <div class='form-floating w-75'>
            <input type='number' class='amount form-control input-frame' placeholder='Deposit Amount'>
            <label for='amount' class='floating-input-placeholder'>Deposit Amount</label>
          </div>
        </div>
        <div class='font-body-tiny mt-1 mb-3'>**Deposit between R25 and R2000</div>

        <div class='form-floating'>
          <input type='password' class='password form-control input-frame' placeholder='Password'>
          <label for='password' class='floating-input-placeholder'>Password</label>
        </div>

        <div class='font-body-tiny mt-1 mb-3'>
          <div>Bank Charges: 2%</div>
          <div>Deposit Fee: 2%</div>
        </div>

        <div class='error-message mb-3'></div>

        <input type='submit' value='Deposit' class='submit-button form-control btn-primary input-frame'>
      </form>
    `;

    return container;
  }, [{ func: formHandler, values: [] }])
}

const cleanForm = () => {
  document.querySelector('.error-message').innerHTML = '';
}

const formHandler = () => {
  document.querySelector('.deposit-form').addEventListener('submit', (event) => {
    event.preventDefault();

    cleanForm();

    const depositAmount = document.querySelector('.amount').value;
    const errorMessage = document.querySelector('.error-message');

    // if (!(depositAmount >= 25 && depositAmount <= 2000)) {
    //   errorMessage.innerHTML = 'Deposit amount must be between R25 and R2000';
    //   return false;
    // }

    submitDepositForm();
  })
}

const getWalletBalance = async () => {
  try {
    const response = await fetch('/wallet/balance');
    const { balance } = await response.json();

    document.querySelector('.balance').innerHTML = parseFloat(balance).toFixed(2);

  } catch (error) {
    console.error(error);
    alert(
      "Sorry, we couldn't fetch your wallet balance. Please check your internet connection and try again localStorage."
    );
  }
}

const submitDepositForm = async () => {
  const depositAmount = document.querySelector('.amount').value;
  const password = document.querySelector('.password').value;
  const submitButton = document.querySelector('.submit-button');

  submitButton.value = 'Depositing...';
  submitButton.disabled = true;

  try {
    const response = await fetch('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount: depositAmount, password: password }),
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      }
    });

    switch (response.status) {
      case 200:
        alert('Your deposit was successfull');
        getWalletBalance();
        break;

      case 400:
        const { message } = await response.json();
    
        document.querySelector('.error-message').innerHTML = 
          message === 'amount_invalid' ? 'Invalid Deposit Amount' : 'Incorrect Password';
        break;

      default:
        alert("Sorry, we couldn't process your transaction. Please try again later.");
    }
  } catch (error) {
    alert("Sorry, we couldn't process your transaction. Please try again later.");
    console.error(error);
  } finally {
    submitButton.value = 'Deposit';
    submitButton.disabled = false;
  };
}
