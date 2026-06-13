## Local development setup instructions (MacOS)

Create dryer-env
```
python3 -m venv dryer-env    
```

```
source dryer-env/bin/activate
```

```
pip install -f requirements.txt
```

If you want to update requirements.txt, you can:
```
pip install <python-package>
pip freeze > requirements.txt
```