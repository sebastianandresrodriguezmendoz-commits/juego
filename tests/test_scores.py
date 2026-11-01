import unittest
import json
from tests.conftest import create_test_client
from app.models import db, User, Score, GameStats, UserAchievement
from app.utils.jwt_manager import generate_token

class ScoresTestCase(unittest.TestCase):
    def setUp(self):
        self.app, self.client = create_test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()

        # Crear usuario base para las pruebas
        self.user = User(username='striker_one', email='striker@gunrun.com')
        self.user.set_password('password123')
        db.session.add(self.user)
        db.session.commit()

        self.token = generate_token(self.user.id, self.user.username)
        self.auth_headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_save_score_success(self):
        """Verifica el guardado de una partida y la inicialización de GameStats."""
        payload = {
            "score": 1500,
            "wave": 3,
            "kills": 25,
            "survival_time": 90,
            "accuracy": 82.5
        }
        res = self.client.post('/api/scores', data=json.dumps(payload), headers=self.auth_headers)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(data['data']['score']['score'], 1500)
        self.assertEqual(data['data']['stats']['highest_score'], 1500)
        self.assertEqual(data['data']['stats']['total_kills'], 25)

    def test_save_score_cumulative_update(self):
        """Verifica la agregación matemática en GameStats a través de múltiples partidas."""
        # Partida 1
        p1 = {"score": 2000, "wave": 4, "kills": 30, "survival_time": 100, "accuracy": 75.0}
        self.client.post('/api/scores', data=json.dumps(p1), headers=self.auth_headers)

        # Partida 2 (Mayor oleada pero menor puntaje)
        p2 = {"score": 1800, "wave": 6, "kills": 20, "survival_time": 80, "accuracy": 68.0}
        res2 = self.client.post('/api/scores', data=json.dumps(p2), headers=self.auth_headers)
        self.assertEqual(res2.status_code, 201)
        stats = res2.get_json()['data']['stats']

        self.assertEqual(stats['total_games'], 2)
        self.assertEqual(stats['total_kills'], 50)
        self.assertEqual(stats['highest_score'], 2000)
        self.assertEqual(stats['highest_wave'], 6)
        self.assertEqual(stats['total_playtime_seconds'], 180)

    def test_achievements_unlock_flow(self):
        """Verifica que los logros (FIRST_BLOOD, WAVE_SURVIVOR_5, SHARPSHOOTER) se desbloqueen y persistan."""
        # Partida con 12 bajas, 80% precisión y oleada 5
        payload = {
            "score": 3200,
            "wave": 5,
            "kills": 12,
            "survival_time": 120,
            "accuracy": 80.0
        }
        res = self.client.post('/api/scores', data=json.dumps(payload), headers=self.auth_headers)
        data = res.get_json()
        self.assertEqual(res.status_code, 201)

        new_ach = data['data']['new_achievements']
        unlocked_keys = [a['achievement_key'] for a in new_ach]
        self.assertIn("FIRST_BLOOD", unlocked_keys)
        self.assertIn("SHARPSHOOTER", unlocked_keys)
        self.assertIn("WAVE_SURVIVOR_5", unlocked_keys)

        # Consultar endpoint de logros
        res_catalog = self.client.get('/api/scores/achievements', headers=self.auth_headers)
        catalog_data = res_catalog.get_json()
        self.assertEqual(catalog_data['data']['unlocked_count'], len(unlocked_keys))

    def test_get_leaderboard_order(self):
        """Verifica que el Leaderboard ordene a los mejores pilotos por puntuación descendente."""
        # Crear segundo usuario con mayor récord
        user2 = User(username='champion_ace', email='ace@gunrun.com')
        user2.set_password('pass123')
        db.session.add(user2)
        db.session.commit()

        # Guardar puntuación moderada para user 1
        s1 = Score(user_id=self.user.id, score=2500, wave=4, kills=20, survival_time=80, accuracy=70.0)
        # Guardar récord mayor para user 2
        s2 = Score(user_id=user2.id, score=9800, wave=12, kills=85, survival_time=320, accuracy=88.5)
        db.session.add_all([s1, s2])
        db.session.commit()

        res = self.client.get('/api/scores/leaderboard')
        self.assertEqual(res.status_code, 200)
        board = res.get_json()['data']['leaderboard']
        self.assertEqual(len(board), 2)
        self.assertEqual(board[0]['rank'], 1)
        self.assertEqual(board[0]['username'], 'champion_ace')
        self.assertEqual(board[0]['score'], 9800)
        self.assertEqual(board[1]['rank'], 2)
        self.assertEqual(board[1]['username'], 'striker_one')

    def test_get_my_history(self):
        """Verifica que /api/scores/my-history retorne las partidas del usuario autenticado."""
        s1 = Score(user_id=self.user.id, score=1000, wave=2, kills=10, survival_time=40, accuracy=65.0)
        s2 = Score(user_id=self.user.id, score=2000, wave=3, kills=15, survival_time=60, accuracy=72.0)
        db.session.add_all([s1, s2])
        db.session.commit()

        res = self.client.get('/api/scores/my-history', headers=self.auth_headers)
        self.assertEqual(res.status_code, 200)
        history = res.get_json()['data']['history']
        self.assertEqual(len(history), 2)

    def test_invalid_score_payload(self):
        """Verifica que puntuaciones con valores negativos o precisión inválida sean rechazadas."""
        bad_payload = {"score": -500, "wave": 1, "kills": 5, "survival_time": 30, "accuracy": 50.0}
        res = self.client.post('/api/scores', data=json.dumps(bad_payload), headers=self.auth_headers)
        self.assertEqual(res.status_code, 400)

        bad_acc = {"score": 500, "wave": 1, "kills": 5, "survival_time": 30, "accuracy": 150.0}
        res_acc = self.client.post('/api/scores', data=json.dumps(bad_acc), headers=self.auth_headers)
        self.assertEqual(res_acc.status_code, 400)

if __name__ == '__main__':
    unittest.main()

