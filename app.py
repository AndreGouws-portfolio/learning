"""Entry point for Orbit CRM.

Run it with:
    python app.py

Then open http://127.0.0.1:5000 in your browser.
"""

from crm import create_app

app = create_app()

if __name__ == "__main__":
    print("\nOrbit CRM is running at http://127.0.0.1:5000\n")
    app.run(debug=True)
