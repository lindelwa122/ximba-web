# Selenium Tests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
# Set up the browser
chrome_driver = "/Users/motin/Desktop/chromedriver"
driver = webdriver.Chrome(executable_path=chrome_driver)

# Navigate to the website
driver.get("https://getvyt-web-production.up.railway.app/")
time.sleep(10)
password = "Wakkies2016!"

# Find the search box element
search_box = driver.find_element(By.NAME, 'Username')
password_entry = driver.find_element(By.NAME, 'Passsword')

# Type "Selenium" into the search box
search_box.send_keys("tlotlo")
password_entry.send_keys(password)
password_entry.send_keys(Keys.ENTER)

# Wait for the search results to load
driver.implicitly_wait(10)

# Verify that the search returned results
assert "No results found." not in driver.page_source

# Close the browser
time.sleep(120)
driver.quit()
