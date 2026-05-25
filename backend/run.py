import os
from dotenv import load_dotenv

print("Loading environment...")
load_dotenv()

from app import create_app

print("Creating app...")
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=app.config["DEBUG"])
