from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import redis 
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId 
import os # Import the os module to access environment variables
from dotenv import load_dotenv
import requests


load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend 

MONGO_CONNECTION_STRING = os.getenv("MONGO_CONNECTION_STRING")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME")

client = None
db = None
messages_collection = None


# --- Redis Configuration ---
# It's highly recommended to use environment variables for production
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))
# Get Redis password from an environment variable for security
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD') 
 # Use SSL/TLS for secure connections
REDIS_TTL_SECONDS = 5 * 60 # 5 minutes TTL

# ---
## Initialize Redis Client
redis_client = None
try:
    # Initialize Redis client with password, timeout, and SSL options
    redis_client = redis.StrictRedis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True,# Optional: For specific SSL configurations
    )
    # Test connection
    redis_client.ping()
    print(f"Successfully connected to Redis at {REDIS_HOST}:{REDIS_PORT}, DB:{REDIS_DB}")
except redis.exceptions.ConnectionError as e:
    redis_client = None
    print(f"Could not connect to Redis: {e}. Caching will be disabled.")
except redis.exceptions.AuthenticationError as e:
    redis_client = None
    print(f"Redis authentication failed: {e}. Check your password.")
except Exception as e:
    redis_client = None
    print(f"An unexpected error occurred while connecting to Redis: {e}. Caching will be disabled.")

    
    
    
# Hard-coded investor profiles
INVESTORS = [
    {
        "id": 1,
        "name": "FAITH INFOTECH ACADEMY",
        "industries": ["fintech", "saas", "ai"],
        "stages": ["seed", "series-a"],
        "risk_tolerance": "high",
        "investment_range": [100000, 5000000],
        "description": "Early-stage tech investor focused on disruptive technologies",
        "contact": "https://faithinfotechacademy.com/",
        "location": "INFOPARK, KOCHIN, KERALA"
    },
    {
        "id": 2,
        "name": "HealthFirst Partners",
        "industries": ["healthtech", "ai"],
        "stages": ["pre-seed", "seed"],
        "risk_tolerance": "medium",
        "investment_range": [50000, 2000000],
        "description": "Specialized healthcare and medical technology investor",
        "contact": "team@healthfirst.vc",
        "location": "Boston, MA"
    },
    {
        "id": 3,
        "name": "Growth Equity Solutions",
        "industries": ["saas", "ecommerce", "fintech"],
        "stages": ["series-a", "series-b"],
        "risk_tolerance": "low",
        "investment_range": [1000000, 20000000],
        "description": "Late-stage growth investor with proven market traction focus",
        "contact": "investments@growthequity.com",
        "location": "New York, NY"
    },
    {
        "id": 4,
        "name": "Innovation Labs Fund",
        "industries": ["ai", "blockchain", "iot"],
        "stages": ["pre-seed", "seed"],
        "risk_tolerance": "high",
        "investment_range": [25000, 1000000],
        "description": "Deep tech investor focused on emerging technologies",
        "contact": "hello@innovationlabs.fund",
        "location": "Austin, TX"
    },
    {
        "id": 5,
        "name": "Education Forward VC",
        "industries": ["edtech", "saas"],
        "stages": ["seed", "series-a"],
        "risk_tolerance": "medium",
        "investment_range": [250000, 3000000],
        "description": "Dedicated to transforming education through technology",
        "contact": "info@educationforward.vc",
        "location": "Seattle, WA"
    },
    {
        "id": 6,
        "name": "Commerce Accelerator",
        "industries": ["ecommerce", "saas", "fintech"],
        "stages": ["pre-seed", "seed", "series-a"],
        "risk_tolerance": "high",
        "investment_range": [100000, 8000000],
        "description": "E-commerce and retail technology specialist",
        "contact": "deals@commerceaccel.com",
        "location": "Los Angeles, CA"
    }
]




# Basic validation for environment variables
if not all([MONGO_CONNECTION_STRING, MONGO_DB_NAME, MONGO_COLLECTION_NAME]):
    print("CRITICAL ERROR: One or more MongoDB environment variables are not set.")
    print("Please ensure MONGO_CONNECTION_STRING, MONGO_DB_NAME, and MONGO_COLLECTION_NAME are defined in your .env file.")
    # In a production app, you might want to raise an exception and stop startup
else:
    try:
        client = MongoClient(MONGO_CONNECTION_STRING)
        # The ping command is cheap and does not require auth.
        # It's a good way to check if the server is alive.
        client.admin.command('ping')
        db = client[MONGO_DB_NAME]
        messages_collection = db[MONGO_COLLECTION_NAME]
        print(f"MongoDB connected successfully to database: {MONGO_DB_NAME}, collection: {MONGO_COLLECTION_NAME}")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to connect to MongoDB: {e}")
        client = None
        db = None
        messages_collection = None
        
# --- Gemini API Configuration ---
# IMPORTANT: Get your Gemini API Key from Google AI Studio or Google Cloud Console
# Store it securely in your .env file
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

if not GEMINI_API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set.")
    print("Please ensure GEMINI_API_KEY is defined in your .env file.")
    # In a production app, you might want to raise an exception and stop startup

def calculate_match_score(founder_profile, investor):
    """
    Calculate match score based on the defined algorithm:
    - +3 points if industry matches
    - +2 if funding stage overlaps
    - +1 if risk tolerance aligns
    - +1 if requested amount falls within investor's range
    """
    score = 0
    match_reasons = []
    
    # Industry match (+3 points)
    if founder_profile.get('industry') in investor['industries']:
        score += 3
        match_reasons.append("Industry alignment")
    
    # Funding stage match (+2 points)
    if founder_profile.get('funding_stage') in investor['stages']:
        score += 2
        match_reasons.append("Funding stage fit")
    
    # Risk tolerance match (+1 point)
    if founder_profile.get('risk_tolerance') == investor['risk_tolerance']:
        score += 1
        match_reasons.append("Risk tolerance match")
    
    # Investment amount range (+1 point)
    try:
        investment_amount = int(founder_profile.get('investment_amount', 0))
        if investor['investment_range'][0] <= investment_amount <= investor['investment_range'][1]:
            score += 1
            match_reasons.append("Investment range fit")
    except (ValueError, TypeError):
        pass
    
    return {
        "score": score,
        "match_reasons": match_reasons,
        "investor": investor
    }

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "message": "Startup Investor Matching API",
        "version": "2.0.0"
    })

@app.route('/api/investors')
def get_investors():
    """Get all available investors"""
    return jsonify({
        "success": True,
        "investors": INVESTORS,
        "count": len(INVESTORS)
    })

@app.route('/api/match', methods=['POST'])
def find_matches():
    """
    Find investor matches for a founder profile, with Redis caching.
    Expected JSON payload:
    {
        "industry": "fintech",
        "funding_stage": "seed",
        "risk_tolerance": "high",
        "investment_amount": 500000,
        "company_name": "StartupCorp"
    }
    """
    try:
        founder_profile = request.get_json()

        # Validate required fields
        required_fields = ['industry', 'funding_stage', 'risk_tolerance', 'investment_amount']
        missing_fields = [field for field in required_fields if not founder_profile.get(field)]

        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Create a cache key from the founder profile.
        # Ensure consistent ordering of keys for consistent hashing.
        cache_key_data = {k: founder_profile.get(k) for k in sorted(founder_profile.keys())}
        cache_key = f"match:{json.dumps(cache_key_data, sort_keys=True)}"

        # --- Try to retrieve from cache ---
        if redis_client:
            try:
                cached_response = redis_client.get(cache_key)
                if cached_response:
                    print(f"Cache HIT for key: {cache_key}")
                    return jsonify(json.loads(cached_response))
            except redis.exceptions.RedisError as e:
                print(f"Redis GET error: {e}. Proceeding without cache.")
        else:
            print("Redis client not available. Skipping cache lookup.")

        # --- If not in cache, calculate matches ---
        print(f"Cache MISS for key: {cache_key}. Calculating matches...")
        matches = []
        for investor in INVESTORS:
            match_result = calculate_match_score(founder_profile, investor)
            if match_result["score"] > 0:  # Only include investors with some match
                matches.append(match_result)

        # Sort by score (highest first) and take top 3
        matches.sort(key=lambda x: x["score"], reverse=True)
        top_matches = matches[:3]

        # Prepare response
        response_data = {
            "success": True,
            "founder_profile": founder_profile,
            "matches": top_matches,
            "total_matches": len(matches),
        }

        # --- Store in cache ---
        if redis_client:
            try:
                # Store the JSON string with a TTL
                redis_client.setex(cache_key, REDIS_TTL_SECONDS, json.dumps(response_data))
                print(f"Response cached for key: {cache_key} with TTL: {REDIS_TTL_SECONDS} seconds.")
            except redis.exceptions.RedisError as e:
                print(f"Redis SETEX error: {e}. Response not cached.")

        return jsonify(response_data)

    except Exception as e:
        # Log the full traceback for debugging in a real application
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500
        
        
@app.route('/api/classify', methods=['POST'])
def classify_questionnaire():
    """
    Receives questionnaire results and uses an AI (Gemini 2.0 Flash) to classify them.
    Expected JSON payload:
    {
        "questionnaire_results": {
            "Question text 1": "Answer text 1",
            "Question text 2": "Answer text 2",
            ...
        },
        "classification_goal": "e.g., 'Determine if this founder is high-risk or low-risk for investment.'"
    }
    """
    if not GEMINI_API_KEY:
        return jsonify({"success": False, "error": "AI service not configured. Missing API Key."}), 500

    try:
        data = request.get_json()
        questionnaire_results = data.get('questionnaire_results')
        classification_goal = data.get('classification_goal', "Classify the given questionnaire results.")

        if not questionnaire_results:
            return jsonify({"success": False, "error": "Missing 'questionnaire_results' in request."}), 400

        # Construct a detailed prompt for the LLM
        prompt_text = f"Based on the following questionnaire results, {classification_goal}:\n\n"
        for question, answer in questionnaire_results.items():
            prompt_text += f"- {question}: {answer}\n"

        prompt_text += "\n"
        # Crucial addition: Explicitly ask for JSON output for the persona
        prompt_text += "Your output MUST be a JSON object with the following keys: 'name' (string), 'description' (string, 2-3 sentences), and 'details' (an array of 3-5 strings representing key preferences or characteristics). Do not include any other text or formatting outside of the JSON object. Example: {'name': 'Ambitious Seed Seeker', 'description': 'This founder is leading an early-stage fintech startup aiming for rapid growth and is comfortable with some investor guidance.', 'details': ['Seeking Seed funding', 'Fintech industry focus', 'Comfortable with medium investor involvement']}"


        headers = {
            'Content-Type': 'application/json'
        }
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt_text}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4, # Slightly increased temperature to allow for more creative persona generation, but still controlled.
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 300 # Increased max output tokens to accommodate more detailed persona description and details array.
            }
        }

        # Make the API call to Gemini
        gemini_response = requests.post(
            f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
            headers=headers,
            json=payload
        )
        gemini_response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)

        gemini_result = gemini_response.json()

        # Extract the generated text
        if gemini_result and gemini_result.get('candidates') and \
           gemini_result['candidates'][0].get('content') and \
           gemini_result['candidates'][0]['content'].get('parts'):
            classification_text = gemini_result['candidates'][0]['content']['parts'][0]['text']
            return jsonify({
                "success": True,
                "classification": classification_text, # This should be the JSON string from Gemini
                "raw_ai_response": gemini_result # Include raw response for debugging
            }), 200
        else:
            print(f"Unexpected Gemini API response structure: {gemini_result}")
            return jsonify({"success": False, "error": "AI returned an unexpected response format."}), 500

    except requests.exceptions.RequestException as e:
        print(f"Error calling Gemini API: {e}")
        return jsonify({"success": False, "error": f"Failed to connect to AI service: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"success": False, "error": f"An internal server error occurred: {e}"}), 500


@app.route('/api/matches_overview', methods=['GET'])
def get_matches_overview():
    cache_key = "investor_matches_overview" # A static key for now. Consider dynamic keys if data is user-specific.

    # 1. Try to pull from Redis first
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            print("Pulled data from Redis (cache hit).")
            # The data stored in Redis is a JSON string, so parse it back to a Python dict
            return jsonify(json.loads(cached_data))

@app.route('/api/investors/<int:investor_id>')
def get_investor_details(investor_id):
    """Get detailed information about a specific investor"""
    investor = next((inv for inv in INVESTORS if inv['id'] == investor_id), None)
    
    if not investor:
        return jsonify({
            "success": False,
            "error": "Investor not found"
        }), 404
    
    return jsonify({
        "success": True,
        "investor": investor
    })

@app.route('/api/industries')
def get_industries():
    """Get all available industries"""
    industries = [
        {"value": "fintech", "label": "FinTech"},
        {"value": "healthtech", "label": "HealthTech"},
        {"value": "edtech", "label": "EdTech"},
        {"value": "saas", "label": "SaaS"},
        {"value": "ecommerce", "label": "E-commerce"},
        {"value": "ai", "label": "AI/ML"},
        {"value": "blockchain", "label": "Blockchain"},
        {"value": "iot", "label": "IoT"}
    ]
    
    return jsonify({
        "success": True,
        "industries": industries
    })

@app.route('/api/funding-stages')
def get_funding_stages():
    """Get all available funding stages"""
    stages = [
        {"value": "pre-seed", "label": "Pre-Seed"},
        {"value": "seed", "label": "Seed"},
        {"value": "series-a", "label": "Series A"},
        {"value": "series-b", "label": "Series B"}
    ]
    
    return jsonify({
        "success": True,
        "stages": stages
    })

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """
    Retrieves chat messages from MongoDB.
    """
    if messages_collection is None:
        return jsonify({"success": False, "error": "Database not connected."}), 500

    try:
        # Fetch all messages, sorted by timestamp
        # In MongoDB, `_id` is automatically added and can be used for natural ordering
        # if you want to ensure order by insertion, or explicitly store a timestamp.
        # We'll explicitly store a 'timestamp' field.
        messages_cursor = messages_collection.find().sort("timestamp", 1) # 1 for ascending order

        messages_list = []
        for msg_doc in messages_cursor:
            # Convert ObjectId to string for JSON serialization
            msg_doc['_id'] = str(msg_doc['_id'])
            # Convert datetime objects to string for JSON serialization
            if 'timestamp' in msg_doc and isinstance(msg_doc['timestamp'], datetime):
                msg_doc['timestamp'] = msg_doc['timestamp'].strftime('%b %d, %Y %I:%M %p')
            messages_list.append(msg_doc)

        return jsonify({
            "success": True,
            "messages": messages_list,
            "server_time": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ') # Provide server time
        }), 200
    except Exception as e:
        print(f"Error fetching messages from MongoDB: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to retrieve messages from database."
        }), 500

@app.route('/api/messages/send', methods=['POST'])
def send_message():
    """
    Receives a new message and stores it in MongoDB.
    Expected JSON payload:
    {
        "sender": "founder" or "investor",
        "content": "Your message content"
    }
    """
    if messages_collection is None:
        return jsonify({"success": False, "error": "Database not connected."}), 500

    try:
        message_data = request.get_json()
        if not message_data or not message_data.get('sender') or not message_data.get('content'):
            return jsonify({"success": False, "error": "Missing sender or content in message."}), 400

        # Add current server timestamp
        message_data['timestamp'] = datetime.utcnow()

        # Insert the message into the MongoDB collection
        result = messages_collection.insert_one(message_data)

        return jsonify({
            "success": True,
            "message_id": str(result.inserted_id), # Convert ObjectId to string
            "status": "Message sent successfully."
        }), 201 # 201 Created
    except Exception as e:
        print(f"Error sending message to MongoDB: {e}")
        return jsonify({
            "success": False,
            "error": "Failed to send message to database."
        }), 500



    

if __name__ == '__main__':

    app.run(debug=True, host='0.0.0.0', port=5000)