# Introduction

Our app is set to revolutionize the way people plan, attend, and remember events. From personalized event recommendations based on your interests, to private event creation with QR code access, we've got you covered. But that's just the tip of the iceberg. Imagine being able to relive your most cherished memories, with all the details at your fingertips. Whether it's reuniting with old friends or making new ones, our app will be the ultimate tool for creating and preserving life's most precious moments. So, are you ready to join us on this exciting journey? The future of events is waiting.

# Step-by-Step Guide to Running our Application

## 1. Clone the application

Clone the Django application repository. You can do this using either the HTTPS method in the terminal with the following command:
`git clone https://github.com/getvyt/getvyt-web.git`

Or, alternatively, you can use GitHub Desktop which is a more user-friendly option. Install [GitHub Desktop](https://desktop.github.com/).

### Cloning the Django Application Using GitHub Desktop

- Launch GitHub Desktop.

- Click on the **File** menu on the top left corner, then select **Clone repository** or press **Ctrl+Shift+O**.

- In the clone dialog, select the **URL** option.

- Paste the repository URL `https://github.com/getvyt/getvyt-web.git` and choose a local path for the cloned repository.

- Finally, click the "Clone" button to clone the repository to your local machine.

## 2. Selecting the Correct Branch for Your Work

To switch between branches using the terminal, use the following command: `git checkout <branchname>`.

If you are using GitHub Desktop, click on the "Current Branch" tab and a dropdown menu will appear. Select the desired branch from the dropdown menu.

## 3. Creating and Activating a Virtual Environment

- If you are in the repository directory, navigate to a parent directory by running `cd ..`.

- Create a virtual environment using the following command: `python3 -m venv <env_name>`. Replace <env_name> with the desired name for your virtual environment.

- Activate the virtual environment using the following command: 
  ```# Linux/MacOS
  source <env_name>/bin/activate

   # Windows
  <env_name>\Scripts\activate
  ```

  Note: On Windows, if you encounter an error while running the above command, you can temporarily fix it by running `Set-ExecutionPolicy Unrestricted -Scope Process`.

- After activating the virtual environment, navigate to the repository main directory.
- To deactivate the virtual environment, use the following command: `# Linux/MacOS
deactivate

  ``` # Windows
  <env_name>\deactivate
  ```
  
## 4. Install the required packages

Install the required packages from the requirements.txt file by running the following command: `pip install -r requirements.txt`.

## 5. Run database migrations

Run database migrations to create the necessary database tables: `python manage.py migrate`.

## 6. Setting Up Email Configuration

- Navigate to **getvyt/settings.py** in your project directory.

- Update the email configuration section with your own email settings. You can use email platforms like [Mailgun](https://www.mailgun.com).

- If you are an authorized user, you may have access to a configuration file. Save this file in the **getvyt/** directory and do not change the file name.
  Note: Make sure not to edit the **.gitignore** file.
  
- If needed, you can comment out the email configuration in **settings.py**. However, keep in mind that commenting out the email configuration may cause other operations to not function properly.

- Don't forget to uncomment the email configuration when pushing to GitHub.

## 7. Starting the Application and Logging In

- To start the application, run the following command in your terminal: `python manage.py runserver`.

- To log in, you can either create a new account or use the following credentials:
  - Username: `tester`.
  - Password: `Aa@123456`.
