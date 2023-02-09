import json

from django.test import TestCase, Client
from django.utils.timezone import localtime


from .models import *
from .utils import *

# Create your tests here.
c = Client()


class InviteTestCase(TestCase):

    def setUp(self) -> None:
        # Create user
        user = User.objects.create_user(
            first_name='Sara',
            last_name='Doe',
            username='saradoe',
            email='saradoe@example.com',
            password='Sara@0123',
            email_code=generate_code(),
            code_generation_date=localtime(),
        )

        # Create profile
        Profile.objects.create(user=user)

        # Create profile set up
        ProfileSetUp.objects.create(user=user)

    def test_register_view_invalid_input(self):
        response = c.post('/register',
            {
                'firstname': '',
                'lastname': '',
                'username': '',
                'email': '',
                'password': '',
                'confirm-password': ''
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_register_view_invalid_password(self):
        response = c.post('/register',
            {
                'firstname': 'John',
                'lastname': 'Doe',
                'username': 'therealjohndoe',
                'email': 'thedoe@example.com',
                'password': 'easyPassword',
                'confirm-password': 'easyPassword'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_register_view_password_not_match(self):
        response = c.post('/register',
            {
                'firstname': 'John',
                'lastname': 'Doe',
                'username': 'therealjohndoe',
                'email': 'thedoe@example.com',
                'password': 'easyPassword1',
                'confirm-password': 'easyPassword2'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_register_view_invalid_email(self):
        response = c.post('/register',
            {
                'firstname': 'John',
                'lastname': 'Doe',
                'username': 'therealjohndoe',
                'email': 'saradoe@example.com',
                'password': 'theRealDoe@01',
                'confirm-password': 'theRealDoe@01'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 409)

    def test_register_view_invalid_username(self):
        response = c.post('/register',
            {
                'firstname': 'John',
                'lastname': 'Doe',
                'username': 'saradoe',
                'email': 'thedoe@example.com',
                'password': 'theRealDoe@01',
                'confirm-password': 'theRealDoe@01'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 409)

    def test_register_view_valid(self):
        response = c.post('/register',
            {
                'firstname': 'John',
                'lastname': 'Doe',
                'username': 'therealjohndoe',
                'email': 'thedoe@example.com',
                'password': 'theRealDoe@01',
                'confirm-password': 'theRealDoe@01'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_login_invalid_user(self):
        response = c.post('/login',
            {
                'username': 'therealjohndoe',
                'password': 'theRealDoe@01'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 403)

    def test_login_valid_user(self):
        response = c.post('/login',
            {
                'username': 'saradoe',
                'password': 'Sara@0123'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_reset_password_invalid_email(self):
        response = c.post('/reset_password', 
            {
                'email': 'thedoe@example.com'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 404)

    def test_reset_password_valid_email(self):
        response = c.post('/reset_password', 
            {
                'email': 'saradoe@example.com'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_new_password_invalid_input(self):
        response = c.post('/new_password/saradoe/access',
            {
                'password': '',
                'confirm-password': ''
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_new_password_invalid_password(self):
        response = c.post('/new_password/saradoe/access',
            {
                'password': 'soEasy',
                'confirm-password': 'soEasy'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_new_password_password_not_match(self):
        response = c.post('/new_password/saradoe/access',
            {
                'password': 'newPassword@01',
                'confirm-password': 'oldPassword@05'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_new_password_valid(self):
        response = c.post('/new_password/saradoe/access',
            {
                'password': 'strongPassword@123',
                'confirm-password': 'strongPassword@123'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)
        
    def test_profile(self):
        login = c.login(username='saradoe', password='Sara@0123')
        user = User.objects.get(username='saradoe')
        user.is_email_confirmed = True
        user.save()
        response = c.get('/saradoe')
        self.assertTrue(login)
        self.assertTrue(response.context['authenticated'])

    def test_confirm_email_invalid(self):
        a = Client()
        session = a.session
        session['username'] = 'saradoe'
        session.save()
        response = a.post('/confirm',
            {
                'code': '000000',
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_confirm_email_valid(self):
        b = Client()
        session = b.session
        session['username'] = 'saradoe'
        session.save()
        code = User.objects.get(username='saradoe').email_code
        response = b.post('/confirm',
            {
                'code': code,
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_edit_about_invalid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.post('/profile/add/about',
            {
                'about': 'A really long about. A really long about. A really long about. A really long about.A really long about. A really long about. A really long about.A really long about.A really long about.A really long about.A really long about.A really long about.A really long about.A really long about.A really long about. A really long about. A really long about.A really long about.A really long about.A really long about. A really long about. A really long about.A really long about. A really long about. ',
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 400)

    def test_edit_about_valid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.post('/profile/add/about',
            {
                'about': 'A cool about.'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_edit_email_invalid(self):
        response = c.post('/profile/edit/email',
            {
                'email': 'saradoe@example.com'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 409)

    def test_edit_email_valid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.post('/profile/edit/email',
            {
                'email': 'newemail@example.com'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_edit_fullname(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.post('/profile/edit/fullname',
            {
                'firstName': 'Christopher',
                'lastName': 'Kimberly'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_edit_username_invalid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.post('/profile/edit/username',
            {
                'username': 'saradoe'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 409)

    def test_edit_username_valid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.post('/profile/edit/username',
            {
                'username': 'Amanda'
            },
            content_type='application/json',
            json_encoder=json.decoder
        )
        self.assertEqual(response.status_code, 200)

    def test_get_data_valid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.get('/get/email')
        self.assertEqual(response.status_code, 200)

    def test_get_data_invalid(self):
        c.login(username='saradoe', password='Sara@0123')
        response = c.get('/get/invalid-query')
        self.assertEqual(response.status_code, 404)
    