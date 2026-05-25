import sqlite3

def reset_db():
    conn = sqlite3.connect('instance/resumai.db')
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET subscription_active = 0 WHERE subscription_active = 1")
    conn.commit()
    print(f"Updated {cursor.rowcount} rows.")
    conn.close()

if __name__ == '__main__':
    reset_db()
