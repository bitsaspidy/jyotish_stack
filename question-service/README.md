# Question Understanding Service

Private, local-only Python service for classifying free-form Prashna questions.
It uses deterministic English/Hindi intent rules, sends no data to external APIs,
does not connect to MySQL, and performs no astrology calculations.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --host 127.0.0.1 --port 5100
```

Run its dependency-free classifier tests with:

```bash
python -m unittest discover -s tests -v
```
