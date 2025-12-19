"""
Digital Investment Accelerator (DIA) - Simple Backend
No database required - uses in-memory storage
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import uuid
import bcrypt
from datetime import datetime

app = Flask(__name__)
CORS(app)

# =============================================================================
# IN-MEMORY DATABASE
# =============================================================================

users_db = {}
tokens_db = {}
portfolios_db = {}
transactions_db = {}

# Pre-populate with test user
test_user_id = "user_test_001"
test_password = bcrypt.hashpw("test123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
users_db["testuser"] = {
    "user_id": test_user_id,
    "username": "testuser",
    "password_hash": test_password,
    "risk_profile": "Moderate",
    "created_at": datetime.now()
}
portfolios_db[test_user_id] = {
    "total_value": 1250.75,
    "fund_id": "fund_002",
    "fund_name": "Balanced Green Fund",
    "invested_amount": 1200.00,
    "last_24hr_change": 2.35
}

# =============================================================================
# FUND DATA
# =============================================================================

FUNDS = {
    "fund_001": {
        "fund_id": "fund_001",
        "name": "Energy Transition Fund",
        "ticker": "XANF-ETF",
        "description": "Conservative renewable energy infrastructure fund",
        "risk_level": "Conservative",
        "annual_return": 6.5,
        "price": 124.56,
        "sector": "Green Energy",
        "aum": "45.2M AZN"
    },
    "fund_002": {
        "fund_id": "fund_002",
        "name": "Balanced Green Fund",
        "ticker": "XANF-BGF",
        "description": "Diversified green energy and ICT portfolio",
        "risk_level": "Moderate",
        "annual_return": 9.2,
        "price": 187.34,
        "sector": "Mixed (Green + ICT)",
        "aum": "128.7M AZN"
    },
    "fund_003": {
        "fund_id": "fund_003",
        "name": "ICT Innovation Fund",
        "ticker": "XANF-IIF",
        "description": "Aggressive tech and digital infrastructure growth",
        "risk_level": "Aggressive",
        "annual_return": 14.8,
        "price": 256.78,
        "sector": "ICT & Technology",
        "aum": "89.4M AZN"
    }
}

# =============================================================================
# AUTH DECORATOR
# =============================================================================

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token or token not in tokens_db:
            return jsonify({"success": False, "error": "Invalid or missing token"}), 401
        request.user_id = tokens_db[token]
        return f(*args, **kwargs)
    return decorated

# =============================================================================
# AUTH ENDPOINTS
# =============================================================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    risk_profile = data.get('risk_profile', 'Moderate')

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400

    if username in users_db:
        return jsonify({"success": False, "error": "User already exists"}), 400

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    users_db[username] = {
        "user_id": user_id,
        "username": username,
        "password_hash": password_hash,
        "risk_profile": risk_profile,
        "created_at": datetime.now()
    }

    portfolios_db[user_id] = {
        "total_value": 0.0,
        "fund_id": None,
        "fund_name": None,
        "invested_amount": 0.0,
        "last_24hr_change": 0.0
    }

    token = f"token_{uuid.uuid4().hex}"
    tokens_db[token] = user_id

    return jsonify({
        "success": True,
        "data": {
            "user_id": user_id,
            "token": token
        }
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"}), 400

    user = users_db.get(username)
    if not user:
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({"success": False, "error": "Invalid credentials"}), 401

    token = f"token_{uuid.uuid4().hex}"
    tokens_db[token] = user['user_id']

    return jsonify({
        "success": True,
        "data": {
            "user_id": user['user_id'],
            "token": token
        }
    })

# =============================================================================
# PORTFOLIO ENDPOINTS
# =============================================================================

@app.route('/api/user/<user_id>/portfolio', methods=['GET'])
@token_required
def get_portfolio(user_id):
    portfolio = portfolios_db.get(user_id, {
        "total_value": 0.0,
        "fund_id": None,
        "fund_name": None,
        "invested_amount": 0.0,
        "last_24hr_change": 0.0
    })

    return jsonify({
        "success": True,
        "data": {
            "portfolio": {
                "total_value": portfolio["total_value"],
                "invested_amount": portfolio["invested_amount"],
                "last_24hr_change_percent": portfolio["last_24hr_change"],
                "invested_fund": {
                    "id": portfolio.get("fund_id"),
                    "name": portfolio.get("fund_name"),
                    "sector": FUNDS.get(portfolio.get("fund_id"), {}).get("sector", "Mixed")
                } if portfolio.get("fund_id") else None
            }
        }
    })

# =============================================================================
# FUND ENDPOINTS
# =============================================================================

@app.route('/api/funds', methods=['GET'])
@token_required
def get_funds():
    return jsonify({
        "success": True,
        "data": {"funds": list(FUNDS.values())}
    })

@app.route('/api/funds/recommend', methods=['GET'])
@token_required
def recommend_fund():
    user_id = request.user_id
    user = None
    for u in users_db.values():
        if u['user_id'] == user_id:
            user = u
            break

    risk_profile = user.get('risk_profile', 'Moderate') if user else 'Moderate'

    if risk_profile == 'Conservative':
        fund = FUNDS['fund_001']
    elif risk_profile == 'Aggressive':
        fund = FUNDS['fund_003']
    else:
        fund = FUNDS['fund_002']

    return jsonify({
        "success": True,
        "data": {
            "fund": fund,
            "reason": f"Best match for your {risk_profile} risk profile"
        }
    })

# =============================================================================
# TRANSACTION ENDPOINTS
# =============================================================================

@app.route('/api/transactions/roundup', methods=['POST'])
@token_required
def process_roundup():
    data = request.json
    transaction_amount = data.get('transaction_amount', 0)
    fund_id = data.get('fund_id', 'fund_002')

    roundup = round(1 - (transaction_amount % 1), 2) if transaction_amount % 1 != 0 else 0

    user_id = request.user_id
    if user_id in portfolios_db:
        portfolios_db[user_id]['invested_amount'] += roundup
        portfolios_db[user_id]['total_value'] += roundup
        portfolios_db[user_id]['fund_id'] = fund_id
        portfolios_db[user_id]['fund_name'] = FUNDS.get(fund_id, {}).get('name', 'Unknown Fund')

    return jsonify({
        "success": True,
        "data": {
            "roundup_amount": roundup,
            "fund_id": fund_id,
            "message": f"Invested {roundup} AZN via round-up"
        }
    })

@app.route('/api/transactions/deposit', methods=['POST'])
@token_required
def process_deposit():
    data = request.json
    amount = data.get('amount', 0)
    fund_id = data.get('fund_id', 'fund_002')

    user_id = request.user_id
    if user_id in portfolios_db:
        portfolios_db[user_id]['invested_amount'] += amount
        portfolios_db[user_id]['total_value'] += amount
        portfolios_db[user_id]['fund_id'] = fund_id
        portfolios_db[user_id]['fund_name'] = FUNDS.get(fund_id, {}).get('name', 'Unknown Fund')

    return jsonify({
        "success": True,
        "data": {
            "amount": amount,
            "fund_id": fund_id,
            "message": f"Deposited {amount} AZN"
        }
    })

@app.route('/api/transactions/withdraw', methods=['POST'])
@token_required
def process_withdraw():
    data = request.json
    amount = data.get('amount', 0)

    user_id = request.user_id
    if user_id in portfolios_db:
        portfolios_db[user_id]['invested_amount'] = max(0, portfolios_db[user_id]['invested_amount'] - amount)
        portfolios_db[user_id]['total_value'] = max(0, portfolios_db[user_id]['total_value'] - amount)

    return jsonify({
        "success": True,
        "data": {
            "amount": amount,
            "message": f"Withdrawn {amount} AZN"
        }
    })

# =============================================================================
# LEADERBOARD
# =============================================================================

@app.route('/api/leaderboard', methods=['GET'])
@token_required
def get_leaderboard():
    leaderboard = []
    for username, user in users_db.items():
        portfolio = portfolios_db.get(user['user_id'], {})
        leaderboard.append({
            "username": username,
            "total_invested": portfolio.get('invested_amount', 0),
            "returns": portfolio.get('last_24hr_change', 0)
        })

    leaderboard.sort(key=lambda x: x['total_invested'], reverse=True)
    return jsonify({
        "success": True,
        "data": {"leaderboard": leaderboard[:10]}
    })

# =============================================================================
# B2B STATUS
# =============================================================================

@app.route('/api/b2b-status', methods=['GET'])
@token_required
def get_b2b_status():
    return jsonify({
        "success": True,
        "data": {
            "partner_banks": ["Kapital Bank", "PASHA Bank", "ABB"],
            "total_users": len(users_db),
            "total_invested": sum(p.get('invested_amount', 0) for p in portfolios_db.values())
        }
    })

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "success": True,
        "status": "healthy",
        "database": "in-memory",
        "timestamp": datetime.now().isoformat()
    })

# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("DIA Backend - Simple Version (In-Memory)")
    print("=" * 60)
    print(f"Test user: testuser / test123")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5001, debug=True)
