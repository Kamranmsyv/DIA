"""
Digital Investment Accelerator (DÍA) - Caspian Green Funds (XanF) Module
=========================================================================
A streamlined MVP Backend for FinTech Hackathon.

Technology Stack:
- Python + Flask
- Apache Cassandra Database
- Docker Containerization
- RESTful API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import math
import uuid
import os
import time
import bcrypt
from datetime import datetime
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra.query import SimpleStatement

app = Flask(__name__)
CORS(app)

# =============================================================================
# CASSANDRA DATABASE CONFIGURATION
# =============================================================================

CASSANDRA_HOST = os.environ.get('CASSANDRA_HOST', 'localhost')
CASSANDRA_PORT = int(os.environ.get('CASSANDRA_PORT', 9042))
CASSANDRA_KEYSPACE = os.environ.get('CASSANDRA_KEYSPACE', 'dia_keyspace')

cluster = None
session = None

def connect_to_cassandra(retries=30, delay=5):
    """Connect to Cassandra with retry logic."""
    global cluster, session

    for attempt in range(retries):
        try:
            print(f"Attempting to connect to Cassandra at {CASSANDRA_HOST}:{CASSANDRA_PORT} (attempt {attempt + 1}/{retries})")
            cluster = Cluster([CASSANDRA_HOST], port=CASSANDRA_PORT)
            session = cluster.connect()
            print("Connected to Cassandra successfully!")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            if attempt < retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
    return False

def init_database():
    """Initialize Cassandra keyspace and tables."""
    global session

    # Create keyspace
    session.execute("""
        CREATE KEYSPACE IF NOT EXISTS %s
        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
    """ % CASSANDRA_KEYSPACE)

    session.set_keyspace(CASSANDRA_KEYSPACE)

    # Create users table
    session.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id text PRIMARY KEY,
            username text,
            password_hash text,
            risk_profile text,
            created_at timestamp
        )
    """)

    # Create index on username for lookups
    try:
        session.execute("CREATE INDEX IF NOT EXISTS idx_username ON users (username)")
    except Exception:
        pass

    # Create portfolios table
    session.execute("""
        CREATE TABLE IF NOT EXISTS portfolios (
            user_id text PRIMARY KEY,
            total_value double,
            fund_id text,
            fund_name text,
            invested_amount double,
            last_24hr_change double
        )
    """)

    # Create tokens table (auth_token instead of token - reserved word)
    session.execute("""
        CREATE TABLE IF NOT EXISTS auth_tokens (
            auth_token text PRIMARY KEY,
            user_id text,
            created_at timestamp
        )
    """)

    # Create transactions table for history
    session.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id text,
            user_id text,
            type text,
            amount double,
            fund_id text,
            created_at timestamp,
            PRIMARY KEY (user_id, created_at, transaction_id)
        ) WITH CLUSTERING ORDER BY (created_at DESC, transaction_id ASC)
    """)

    print("Database tables initialized successfully!")

# =============================================================================
# STATIC DATA
# =============================================================================

FUNDS_DB = {
    "fund_001": {
        "id": "fund_001",
        "name": "Energy Transition Fund",
        "description": "A conservative fund focused on stable renewable energy infrastructure investments in the Caspian region.",
        "risk_level": "Conservative",
        "annual_return_mock": 6.5,
        "min_investment": 10.0,
        "sector": "Green Energy"
    },
    "fund_002": {
        "id": "fund_002",
        "name": "Balanced Fund",
        "description": "A diversified portfolio combining green energy assets with emerging ICT opportunities.",
        "risk_level": "Moderate",
        "annual_return_mock": 9.2,
        "min_investment": 10.0,
        "sector": "Mixed (Green + ICT)"
    },
    "fund_003": {
        "id": "fund_003",
        "name": "ICT Innovation Fund",
        "description": "An aggressive growth fund targeting cutting-edge technology startups and digital infrastructure.",
        "risk_level": "Aggressive",
        "annual_return_mock": 14.8,
        "min_investment": 10.0,
        "sector": "ICT & Technology"
    }
}

RISK_FUND_MAPPING = {
    "Conservative": "fund_001",
    "Moderate": "fund_002",
    "Aggressive": "fund_003"
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_token():
    return f"token_{uuid.uuid4().hex[:24]}"

def generate_user_id():
    return f"user_{uuid.uuid4().hex[:8]}"

def generate_transaction_id():
    return f"txn_{uuid.uuid4().hex[:12]}"

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password, password_hash):
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def calculate_roundup(amount):
    ceiling = math.ceil(amount)
    roundup = round(ceiling - amount, 2)
    if roundup == 0:
        roundup = 1.0
    return roundup

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token:
            return jsonify({
                "success": False,
                "error": "Authentication token is missing",
                "code": "AUTH_TOKEN_MISSING"
            }), 401

        # Look up token in database
        result = session.execute(
            "SELECT user_id FROM auth_tokens WHERE auth_token = %s",
            [token]
        ).one()

        if not result:
            return jsonify({
                "success": False,
                "error": "Invalid or expired token",
                "code": "AUTH_TOKEN_INVALID"
            }), 401

        kwargs['current_user_id'] = result.user_id
        return f(*args, **kwargs)

    return decorated

# =============================================================================
# API ENDPOINTS: AUTHENTICATION
# =============================================================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    required_fields = ['username', 'password', 'risk_profile']
    for field in required_fields:
        if field not in data:
            return jsonify({
                "success": False,
                "error": f"Missing required field: {field}",
                "code": "VALIDATION_ERROR"
            }), 400

    username = data['username']
    password = data['password']
    risk_profile = data['risk_profile']

    valid_profiles = ['Conservative', 'Moderate', 'Aggressive']
    if risk_profile not in valid_profiles:
        return jsonify({
            "success": False,
            "error": f"Invalid risk_profile. Must be one of: {valid_profiles}",
            "code": "INVALID_RISK_PROFILE"
        }), 400

    # Check if username exists
    existing = session.execute(
        "SELECT user_id FROM users WHERE username = %s ALLOW FILTERING",
        [username]
    ).one()

    if existing:
        return jsonify({
            "success": False,
            "error": "Username already exists",
            "code": "USERNAME_EXISTS"
        }), 409

    # Create user
    user_id = generate_user_id()
    password_hash = hash_password(password)

    session.execute(
        """INSERT INTO users (user_id, username, password_hash, risk_profile, created_at)
           VALUES (%s, %s, %s, %s, %s)""",
        [user_id, username, password_hash, risk_profile, datetime.now()]
    )

    # Initialize portfolio
    session.execute(
        """INSERT INTO portfolios (user_id, total_value, fund_id, fund_name, invested_amount, last_24hr_change)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [user_id, 0.0, None, None, 0.0, 0.0]
    )

    return jsonify({
        "success": True,
        "message": "User registered successfully",
        "data": {
            "user_id": user_id,
            "username": username,
            "risk_profile": risk_profile
        }
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()

    if 'username' not in data or 'password' not in data:
        return jsonify({
            "success": False,
            "error": "Username and password are required",
            "code": "VALIDATION_ERROR"
        }), 400

    username = data['username']
    password = data['password']

    # Find user
    user = session.execute(
        "SELECT user_id, password_hash FROM users WHERE username = %s ALLOW FILTERING",
        [username]
    ).one()

    if not user:
        return jsonify({
            "success": False,
            "error": "User not found",
            "code": "USER_NOT_FOUND"
        }), 404

    if not verify_password(password, user.password_hash):
        return jsonify({
            "success": False,
            "error": "Invalid password",
            "code": "INVALID_CREDENTIALS"
        }), 401

    # Generate and store token
    token = generate_token()
    session.execute(
        "INSERT INTO auth_tokens (auth_token, user_id, created_at) VALUES (%s, %s, %s)",
        [token, user.user_id, datetime.now()]
    )

    return jsonify({
        "success": True,
        "message": "Login successful",
        "data": {
            "user_id": user.user_id,
            "token": token,
            "token_type": "Bearer"
        }
    }), 200


@app.route('/api/user/<user_id>/portfolio', methods=['GET'])
@token_required
def get_portfolio(user_id, current_user_id):
    # Get user
    user = session.execute(
        "SELECT user_id FROM users WHERE user_id = %s",
        [user_id]
    ).one()

    if not user:
        return jsonify({
            "success": False,
            "error": "User not found",
            "code": "USER_NOT_FOUND"
        }), 404

    # Get portfolio
    portfolio = session.execute(
        "SELECT * FROM portfolios WHERE user_id = %s",
        [user_id]
    ).one()

    if not portfolio:
        portfolio_data = {
            "total_value": 0.0,
            "invested_amount": 0.0,
            "last_24hr_change_percent": 0.0,
            "invested_fund": None
        }
    else:
        fund_details = None
        if portfolio.fund_id:
            fund = FUNDS_DB.get(portfolio.fund_id)
            if fund:
                fund_details = {
                    "name": fund['name'],
                    "sector": fund['sector'],
                    "annual_return_mock": fund['annual_return_mock']
                }

        portfolio_data = {
            "total_value": round(portfolio.total_value or 0, 2),
            "invested_amount": round(portfolio.invested_amount or 0, 2),
            "last_24hr_change_percent": portfolio.last_24hr_change or 0,
            "invested_fund": fund_details
        }

    return jsonify({
        "success": True,
        "data": {
            "user_id": user_id,
            "portfolio": portfolio_data,
            "currency": "AZN"
        }
    }), 200


# =============================================================================
# API ENDPOINTS: INVESTMENT
# =============================================================================

@app.route('/api/funds/recommend', methods=['GET'])
@token_required
def recommend_fund(current_user_id):
    user = session.execute(
        "SELECT risk_profile FROM users WHERE user_id = %s",
        [current_user_id]
    ).one()

    if not user:
        return jsonify({
            "success": False,
            "error": "User not found",
            "code": "USER_NOT_FOUND"
        }), 404

    risk_profile = user.risk_profile
    recommended_fund_id = RISK_FUND_MAPPING.get(risk_profile)
    recommended_fund = FUNDS_DB.get(recommended_fund_id)

    return jsonify({
        "success": True,
        "data": {
            "user_risk_profile": risk_profile,
            "recommendation": {
                "fund_id": recommended_fund['id'],
                "fund_name": recommended_fund['name'],
                "description": recommended_fund['description'],
                "risk_level": recommended_fund['risk_level'],
                "annual_return_mock": recommended_fund['annual_return_mock'],
                "sector": recommended_fund['sector'],
                "min_investment_azn": recommended_fund['min_investment']
            },
            "recommendation_reason": f"Based on your {risk_profile} risk profile, we recommend the {recommended_fund['name']}."
        }
    }), 200


@app.route('/api/transactions/roundup', methods=['POST'])
@token_required
def process_roundup(current_user_id):
    data = request.get_json()

    if 'transaction_amount' not in data or 'fund_id' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required fields",
            "code": "VALIDATION_ERROR"
        }), 400

    try:
        transaction_amount = float(data['transaction_amount'])
        if transaction_amount <= 0:
            raise ValueError()
    except:
        return jsonify({
            "success": False,
            "error": "Invalid transaction_amount",
            "code": "INVALID_AMOUNT"
        }), 400

    fund_id = data['fund_id']
    if fund_id not in FUNDS_DB:
        return jsonify({
            "success": False,
            "error": "Fund not found",
            "code": "FUND_NOT_FOUND"
        }), 404

    fund = FUNDS_DB[fund_id]
    roundup_amount = calculate_roundup(transaction_amount)
    rounded_to = math.ceil(transaction_amount)

    # Get current portfolio
    portfolio = session.execute(
        "SELECT * FROM portfolios WHERE user_id = %s",
        [current_user_id]
    ).one()

    old_value = portfolio.total_value if portfolio else 0.0
    new_value = old_value + roundup_amount
    invested = (portfolio.invested_amount if portfolio else 0.0) + roundup_amount
    mock_daily_change = round((fund['annual_return_mock'] / 365) * (1 + (roundup_amount / 100)), 2)

    # Update portfolio
    session.execute(
        """UPDATE portfolios SET total_value = %s, fund_id = %s, fund_name = %s,
           invested_amount = %s, last_24hr_change = %s WHERE user_id = %s""",
        [new_value, fund_id, fund['name'], invested, mock_daily_change, current_user_id]
    )

    # Record transaction
    session.execute(
        """INSERT INTO transactions (transaction_id, user_id, type, amount, fund_id, created_at)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [generate_transaction_id(), current_user_id, 'roundup', roundup_amount, fund_id, datetime.now()]
    )

    return jsonify({
        "success": True,
        "message": "Round-up investment processed successfully!",
        "data": {
            "transaction": {
                "original_amount": transaction_amount,
                "rounded_to": rounded_to,
                "roundup_amount": roundup_amount,
                "currency": "AZN"
            },
            "investment": {
                "fund_id": fund_id,
                "fund_name": fund['name'],
                "amount_invested": roundup_amount
            },
            "portfolio": {
                "previous_value": round(old_value, 2),
                "new_total_value": round(new_value, 2),
                "total_invested": round(invested, 2)
            }
        }
    }), 200


@app.route('/api/transactions/deposit', methods=['POST'])
@token_required
def process_deposit(current_user_id):
    data = request.get_json()

    if 'amount' not in data or 'fund_id' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required fields",
            "code": "VALIDATION_ERROR"
        }), 400

    try:
        amount = float(data['amount'])
        if amount <= 0:
            raise ValueError()
    except:
        return jsonify({
            "success": False,
            "error": "Invalid amount",
            "code": "INVALID_AMOUNT"
        }), 400

    fund_id = data['fund_id']
    if fund_id not in FUNDS_DB:
        return jsonify({
            "success": False,
            "error": "Fund not found",
            "code": "FUND_NOT_FOUND"
        }), 404

    fund = FUNDS_DB[fund_id]

    portfolio = session.execute(
        "SELECT * FROM portfolios WHERE user_id = %s",
        [current_user_id]
    ).one()

    old_value = portfolio.total_value if portfolio else 0.0
    new_value = old_value + amount
    invested = (portfolio.invested_amount if portfolio else 0.0) + amount
    mock_daily_change = round((fund['annual_return_mock'] / 365) * 1.5, 2)

    session.execute(
        """UPDATE portfolios SET total_value = %s, fund_id = %s, fund_name = %s,
           invested_amount = %s, last_24hr_change = %s WHERE user_id = %s""",
        [new_value, fund_id, fund['name'], invested, mock_daily_change, current_user_id]
    )

    session.execute(
        """INSERT INTO transactions (transaction_id, user_id, type, amount, fund_id, created_at)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [generate_transaction_id(), current_user_id, 'deposit', amount, fund_id, datetime.now()]
    )

    return jsonify({
        "success": True,
        "message": "Deposit successful!",
        "data": {
            "transaction": {
                "type": "deposit",
                "amount": amount,
                "currency": "AZN"
            },
            "investment": {
                "fund_id": fund_id,
                "fund_name": fund['name']
            },
            "portfolio": {
                "previous_value": round(old_value, 2),
                "new_total_value": round(new_value, 2)
            }
        }
    }), 200


@app.route('/api/transactions/withdraw', methods=['POST'])
@token_required
def process_withdraw(current_user_id):
    data = request.get_json()

    if 'amount' not in data:
        return jsonify({
            "success": False,
            "error": "Missing required field: amount",
            "code": "VALIDATION_ERROR"
        }), 400

    try:
        amount = float(data['amount'])
        if amount <= 0:
            raise ValueError()
    except:
        return jsonify({
            "success": False,
            "error": "Invalid amount",
            "code": "INVALID_AMOUNT"
        }), 400

    portfolio = session.execute(
        "SELECT * FROM portfolios WHERE user_id = %s",
        [current_user_id]
    ).one()

    if not portfolio or (portfolio.total_value or 0) < amount:
        return jsonify({
            "success": False,
            "error": "Insufficient balance",
            "code": "INSUFFICIENT_BALANCE"
        }), 400

    old_value = portfolio.total_value
    new_value = old_value - amount
    invested = max(0, (portfolio.invested_amount or 0) - amount)

    session.execute(
        """UPDATE portfolios SET total_value = %s, invested_amount = %s WHERE user_id = %s""",
        [new_value, invested, current_user_id]
    )

    session.execute(
        """INSERT INTO transactions (transaction_id, user_id, type, amount, fund_id, created_at)
           VALUES (%s, %s, %s, %s, %s, %s)""",
        [generate_transaction_id(), current_user_id, 'withdraw', amount, portfolio.fund_id, datetime.now()]
    )

    return jsonify({
        "success": True,
        "message": "Withdrawal successful!",
        "data": {
            "transaction": {
                "type": "withdraw",
                "amount": amount,
                "currency": "AZN"
            },
            "portfolio": {
                "previous_value": round(old_value, 2),
                "new_total_value": round(new_value, 2)
            }
        }
    }), 200


# =============================================================================
# API ENDPOINTS: OTHER
# =============================================================================

@app.route('/api/funds', methods=['GET'])
def list_funds():
    return jsonify({
        "success": True,
        "data": {
            "funds": list(FUNDS_DB.values()),
            "total_funds": len(FUNDS_DB)
        }
    }), 200


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    # Get top investors from database
    rows = session.execute(
        "SELECT user_id, total_value FROM portfolios"
    ).all()

    # Sort by total_value
    sorted_portfolios = sorted(rows, key=lambda x: x.total_value or 0, reverse=True)[:10]

    leaderboard = []
    for rank, row in enumerate(sorted_portfolios, 1):
        user = session.execute(
            "SELECT username FROM users WHERE user_id = %s",
            [row.user_id]
        ).one()
        if user:
            leaderboard.append({
                "rank": rank,
                "username": user.username,
                "total_invested": round(row.total_value or 0, 2)
            })

    # Add mock data if less than 5
    mock_users = [
        {"rank": 6, "username": "green_investor_az", "total_invested": 2450.80},
        {"rank": 7, "username": "baku_saver", "total_invested": 1890.50},
        {"rank": 8, "username": "caspian_trader", "total_invested": 1567.25},
    ]

    while len(leaderboard) < 5:
        if mock_users:
            mock = mock_users.pop(0)
            mock["rank"] = len(leaderboard) + 1
            leaderboard.append(mock)
        else:
            break

    return jsonify({
        "success": True,
        "data": {
            "leaderboard": leaderboard,
            "updated_at": datetime.now().isoformat(),
            "currency": "AZN"
        }
    }), 200


@app.route('/api/b2b-status', methods=['GET'])
def get_b2b_status():
    return jsonify({
        "success": True,
        "data": {
            "partnership_status": "Operational",
            "partner_bank": "Mock National Bank of Azerbaijan",
            "api_version": "v1.0",
            "integration_type": "White-Label",
            "services": {
                "transaction_monitoring": "Active",
                "round_up_processing": "Active",
                "fund_transfers": "Active",
                "kyc_verification": "Active"
            },
            "uptime_percent": 99.9,
            "last_sync": datetime.now().isoformat()
        }
    }), 200


@app.route('/api/health', methods=['GET'])
def health_check():
    db_status = "healthy"
    try:
        session.execute("SELECT now() FROM system.local")
    except:
        db_status = "unhealthy"

    return jsonify({
        "success": True,
        "status": "healthy",
        "database": db_status,
        "service": "DÍA - Digital Investment Accelerator",
        "version": "1.0.0-docker",
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "success": True,
        "message": "Welcome to DÍA - Digital Investment Accelerator API",
        "version": "1.0.0-docker",
        "database": "Apache Cassandra"
    }), 200


# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"success": False, "error": "Internal server error"}), 500


# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║   DÍA - Digital Investment Accelerator                        ║
    ║   Docker + Cassandra Edition                                  ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)

    if connect_to_cassandra():
        init_database()
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to connect to Cassandra. Exiting.")
        exit(1)
