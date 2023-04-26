from flask import Flask, redirect, g, render_template, request, session, jsonify, flash
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import login_required
from helpers import is_invalid_username, is_valid_email
import sqlite3
import datetime

# Configure Application
app = Flask(__name__)
DATABASE = 'todolist.db'


#   Configuring the database
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = make_dicts
        return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


#   Row factory function
def make_dicts(cursor, row):
    return dict((cursor.description[idx][0], value) for idx, value in enumerate(row))


# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)


@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    #   Serve the layout page as a test
    """ TODO """
    #   Checks to log user out after a few hours of inactivity
    last_activity = session.get("last_activity")
    if last_activity is not None and (datetime.datetime.now() - last_activity).seconds > 60 * 60 * 2:
        session.clear()
        return redirect("/login")
    else:
        session["last_activity"] = datetime.datetime.now()
    
    conn = get_db()
    db = conn.cursor()

    if request.method == "POST":
        task = request.form.get("task")
        db.execute("INSERT INTO tasks (id, body) VALUES (?, ?)",
                   (session["user_id"], task))

        #   Commit  the changes
        conn.commit()

    query = db.execute("SELECT username FROM users WHERE id = ? ",
                       (session["user_id"],)).fetchall()

    username = query[0]["username"]
    return render_template("index.html", username=username)


@app.route("/login", methods=["GET", "POST"])
def login():
    # connect to the database
    conn = get_db()
    db = conn.cursor()
    """Log user in"""

    error = {}

    #   Forget any user_id
    session.clear()

    #   If user is submitting data to the login form via post
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username:
            error["username"] = "Username is required"
            return render_template("login.html", error=error)

        elif not password:
            error["password"] = "You have to input a password"
            return render_template("login.html", error=error)

        #  Get all users from the database
        user = db.execute("SELECT * FROM users WHERE username = ?", (username, )).fetchall()
        #   Check if the username exists and password is correct
        if len(user) != 1 or not check_password_hash(user[0]["hash"], password):
            error["password"] = "Invalid username/password"
            error["username"] = "Invalid username/password"
            return render_template("login.html", error=error)

        #   if all is good

        #   Set the session of the user
        session["user_id"] = user[0]["id"]
        session["last_activity"] = datetime.datetime.now()

        #   Commit the changes
        conn.commit()
        conn.close()

        #   Redirect user to homepage
        return redirect("/")

    else:
        return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    """LOG USER OUT"""
    #   Forget any user id
    session.clear()

    #   Redirect user to login Form
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():
    #   Connect to the database
    conn = get_db()
    db = conn.cursor()
    """ Register A New User"""
    error = {}
    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")

        if not username:
            error["username"] = "Username is required"
            return render_template("register.html", error=error)

        if not password:
            error["password"] = "You have to input a password"
            return render_template("register.html", error=error)

        if password and password != confirmation:
            error["password"] = "Passwords do not match"
            return render_template("register.html", error=error)

        if not email:
            error["email"] = "email is required"
            return render_template("register.html", error=error)

        if username and is_invalid_username(username):
            error["username"] = "inalid username [Atleast 4 characters, numbers and letters]"
            return render_template("register.html", error=error)

        if email and not is_valid_email(email):
            error["email"] = "Invalid Email"
            return render_template("register.html", error=error)

        #   Check if the provided username exists in the database
        users = [user['username'] for user in db.execute("SELECT username FROM users").fetchall()]

        if username in users:
            error["username"] = "Username has already been taken"
            return render_template("register.html", error=error)

        # If the input is good, add the user to the database, and redirect to login
        db.execute("INSERT INTO users (username, email, hash) VALUES (?, ?, ?)",
                (username, email, generate_password_hash(password)))

        #   Commit the changes
        conn.commit()
        conn.close()

        return redirect("/login")

    return render_template("register.html", error=error)


#   Route to display all tasks
@app.route("/tasks")
@login_required
def get_tasks():
    #   Connect to the database
    conn = get_db()
    db = conn.cursor()
    #   Get all tasks of the user
    tasks = db.execute("SELECT * FROM tasks WHERE id = ?", (session["user_id"], )).fetchall()
    return jsonify(tasks)


#   Route to display all active tasks
@app.route("/tasks/<string:status>")
@login_required
def get_acive_tasks(status):
    #   Connect to the database
    conn = get_db()
    db = conn.cursor()
    if status == 'active':
        #   Get all tasks of the user
        tasks = db.execute("SELECT * FROM tasks WHERE id = ? AND complete = 0", (session["user_id"], )).fetchall()
    elif status == 'completed':
        tasks = db.execute("SELECT * FROM tasks WHERE id = ? AND complete = 1", (session["user_id"], )).fetchall()
    return jsonify(tasks)


#   Route to delete a task given an id
@app.route('/delete_task/<int:task_id>')
@login_required
def delete_task(task_id):
    # Connect to the database
    conn = get_db()
    db = conn.cursor()
    # Delete the task from the database
    db.execute("DELETE FROM tasks WHERE task_id = ? AND id = ?", (task_id, session["user_id"], ))
    conn.commit()
    flash("Task deleted successfully", "success")
    return redirect('/')


#   Route to delete all completed
@app.route('/delete_task/completed')
@login_required
def delete_completed_task():
    # Connect to the database
    conn = get_db()
    db = conn.cursor()
    # Delete the task from the database
    db.execute("DELETE FROM tasks WHERE complete = 1 AND id = ?", (session["user_id"], ))
    conn.commit()
    flash("Tasks deleted successfully", "success")
    return redirect('/')


#   Route to mark a task as complete
@app.route('/update-task/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    conn = get_db()
    db = conn.cursor()

    row = db.execute("SELECT * FROM tasks WHERE task_id = ? and id = ?",
        (task_id, session["user_id"], )).fetchall()
    status = row[0]["complete"]
    if status == 0:
        new_status = 1
    elif status == 1:
        new_status = 0
    db.execute("UPDATE tasks SET complete = ? WHERE task_id = ? AND id = ?",
               (new_status, task_id, session["user_id"], ))

    conn.commit()

    return redirect("/")
