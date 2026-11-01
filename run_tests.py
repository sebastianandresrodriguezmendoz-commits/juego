import unittest
import sys
import os

# Configurar salida en UTF-8 para compatibilidad universal en consola de Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

if __name__ == '__main__':
    # Asegurar que la raíz del proyecto esté en el path
    root_dir = os.path.abspath(os.path.dirname(__file__))
    sys.path.insert(0, root_dir)
    sys.path.insert(0, os.path.join(root_dir, 'backend'))

    print("==================================================")
    print("  GunRun 2D - Suite de Pruebas Automatizadas")
    print("  Backend API, Modelos, Autenticacion y Puntajes")
    print("==================================================")

    # Descubrir y ejecutar todos los tests en la carpeta tests/
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir='tests', pattern='test_*.py')

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if result.wasSuccessful():
        print("\n[OK] TODAS LAS PRUEBAS PASARON EXITOSAMENTE (100% SUCCESS)")
        sys.exit(0)
    else:
        print(f"\n[FAIL] SE ENCONTRARON FALLOS: {len(result.failures)} fallos, {len(result.errors)} errores")
        sys.exit(1)

