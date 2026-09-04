from django.test import TestCase
from apps.accounts.models import User
from apps.workspaces.models import Workspace, WorkspaceMember
from rest_framework.test import APIClient

class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/v1/auth/register'
        self.login_url = '/api/v1/auth/login'
        self.me_url = '/api/v1/users/me'

    def test_user_registration_and_workspace_creation(self):
        payload = {
            "email": "testuser@creatorflow.ai",
            "password": "SecurePassword123!",
            "full_name": "Test Creator"
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertIn('access_token', response.data['data'])
        self.assertEqual(response.data['data']['user']['email'], "testuser@creatorflow.ai")
        
        # Verify workspace creation
        user = User.objects.get(email="testuser@creatorflow.ai")
        self.assertTrue(Workspace.objects.filter(owner=user).exists())
        self.assertTrue(WorkspaceMember.objects.filter(user=user, role='Owner').exists())

    def test_user_login(self):
        user = User.objects.create_user(email="login@creatorflow.ai", password="MyPassword123!", full_name="Login User")
        payload = {
            "email": "login@creatorflow.ai",
            "password": "MyPassword123!"
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('access_token', response.data['data'])
