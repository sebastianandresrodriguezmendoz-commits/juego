import unittest
import json
from tests.conftest import create_test_client
from app.models import db, User

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app, self.client = create_test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_register_success(self):
        """Verifica que un jugador se registre correctamente con hash y reciba su token JWT."""
        payload = {
            "username": "soldado_neon",
            "email": "soldado@gunrun.com",
            "password": "passwordSeguro123"
        }
        res = self.client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('token', data['data'])
        self.assertEqual(data['data']['user']['username'], 'soldado_neon')

        # Verificar en base de datos
        user = User.query.filter_by(username='soldado_neon').first()
        self.assertIsNotNone(user)
        self.assertTrue(user.check_password("passwordSeguro123"))

    def test_register_duplicate_username(self):
        """Verifica que se rechacen nombres de usuario duplicados con HTTP 409."""
        payload = {
            "username": "piloto_clon",
            "email": "clon1@gunrun.com",
            "password": "passwordSeguro123"
        }
        self.client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')

        # Intentar registrar mismo username con correo distinto
        payload_dup = {
            "username": "piloto_clon",
            "email": "clon2@gunrun.com",
            "password": "passwordSeguro123"
        }
        res = self.client.post('/api/auth/register', data=json.dumps(payload_dup), content_type='application/json')
        self.assertEqual(res.status_code, 409)
        data = res.get_json()
        self.assertFalse(data['success'])

    def test_register_invalid_email(self):
        """Verifica que se rechace un formato de correo inválido."""
        payload = {
            "username": "jugador_test",
            "email": "correo_invalido_sin_arroba",
            "password": "passwordSeguro123"
        }
        res = self.client.post('/api/auth/register', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 400)

    def test_login_success(self):
        """Verifica el login con username y emisión de token JWT."""
        user = User(username='hunter_2d', email='hunter@gunrun.com')
        user.set_password('claveSecreta')
        db.session.add(user)
        db.session.commit()

        payload = {"identifier": "hunter_2d", "password": "claveSecreta"}
        res = self.client.post('/api/auth/login', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('token', data['data'])

    def test_login_with_email(self):
        """Verifica el login usando la dirección de correo en vez del username."""
        user = User(username='ace_pilot', email='ace@gunrun.com')
        user.set_password('claveSecreta')
        db.session.add(user)
        db.session.commit()

        payload = {"identifier": "ace@gunrun.com", "password": "claveSecreta"}
        res = self.client.post('/api/auth/login', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])

    def test_login_wrong_password(self):
        """Verifica que contraseñas erróneas retornen HTTP 401."""
        user = User(username='defender', email='def@gunrun.com')
        user.set_password('claveCorrecta')
        db.session.add(user)
        db.session.commit()

        payload = {"identifier": "defender", "password": "claveIncorrecta"}
        res = self.client.post('/api/auth/login', data=json.dumps(payload), content_type='application/json')
        self.assertEqual(res.status_code, 401)

    def test_profile_authenticated(self):
        """Verifica el acceso a /api/auth/profile utilizando el Bearer Token."""
        user = User(username='cyborg_pro', email='cyborg@gunrun.com')
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()

        from app.utils.jwt_manager import generate_token
        token = generate_token(user.id, user.username)

        res = self.client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['user']['username'], 'cyborg_pro')

    def test_profile_unauthorized(self):
        """Verifica que peticiones sin token o con token alterado sean rechazadas con HTTP 401."""
        res = self.client.get('/api/auth/profile')
        self.assertEqual(res.status_code, 401)

        res_bad = self.client.get('/api/auth/profile', headers={'Authorization': 'Bearer token_invalido_123'})
        self.assertEqual(res_bad.status_code, 401)

if __name__ == '__main__':
    unittest.main()

