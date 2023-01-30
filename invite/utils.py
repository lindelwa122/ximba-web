from random import randint, choices
from string import hexdigits

def check_upper(str):
    for char in str:
        if char.isupper():
            return True
    return False

def check_lower(str):
    for char in str:
        if char.islower():
            return True
    return False

def check_digit(str):
    for char in str:
        if char.isdigit():
            return True
    return False

def generate_code():
    return randint(100000, 999999)

def generate_hash(n: int):
    hash_ls = choices(hexdigits, k=n)
    hash = ''
    for char in hash_ls:
        hash += char
    return hash

def get_img_url(image):
    # Create a list
    image_url_array = image.url.split('/')

    if image_url_array[-1] != 'default.png':
        # Delete the second element (invite)
        del image_url_array[1]

    # Join the list
    return '/'.join(image_url_array)