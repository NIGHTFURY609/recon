from flask import Flask, request, render_template,jsonify
from flask_cors import CORS
import json
import redis 
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId 
import gspread
from google.oauth2 import service_account
import os
from dotenv import load_dotenv
import requests




load_dotenv()


CREDENTIALS_FILE = './recon-credentials.json'
SHEET_ID = os.getenv("SHEET_ID")


app = Flask(__name__)
CORS(app)

MONGO_CONNECTION_STRING = os.getenv("MONGO_CONNECTION_STRING")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME")

client = None
db = None
messages_collection = None


# Redis Configuration 
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))
REDIS_DB = int(os.environ.get('REDIS_DB', 0))
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD') 
REDIS_TTL_SECONDS = 5 * 60 # 5 minutes TTL

# Initialize Redis Client
redis_client = None
try:
    # Initialize Redis client with password, timeout, and SSL options
    redis_client = redis.StrictRedis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=REDIS_PASSWORD,
        decode_responses=True,
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

    
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:5000')





# Basic validation for environment variables
if not all([MONGO_CONNECTION_STRING, MONGO_DB_NAME, MONGO_COLLECTION_NAME]):
    print("CRITICAL ERROR: One or more MongoDB environment variables are not set.")
    print("Please ensure MONGO_CONNECTION_STRING, MONGO_DB_NAME, and MONGO_COLLECTION_NAME are defined in your .env file.")
else:
    try:
        client = MongoClient(MONGO_CONNECTION_STRING)
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
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

if not GEMINI_API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set.")
    print("Please ensure GEMINI_API_KEY is defined in your .env file.")
    
def get_investors_from_sheet():
    """
    Authenticates with Google Sheets API and fetches investor data.
    """
    try:
        scope = ['https://spreadsheets.google.com/feeds',
                 'https://www.googleapis.com/auth/drive',
                 'https://www.googleapis.com/auth/spreadsheets']
        
        creds = service_account.Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=scope
        )
        
        client = gspread.authorize(creds)
        try:
            sheet = client.open_by_key(SHEET_ID)
        except:
            print("An error occurred! Google Sheet not found. Please check the SHEET_ID.")
        
        try:
            worksheet = sheet.get_worksheet(0) # Get the first worksheet (index 0)
            print(f"Successfully selected worksheet: '{worksheet.title}' (at index 0)")
        except gspread.exceptions.WorksheetNotFound:
            print(f"ERROR: No worksheet found at index 0. This shouldn't happen unless the sheet is truly empty.")
            return []
        except Exception as e:
            print(f"ERROR: An unexpected error occurred while trying to access the worksheet at index 0. Details: {e}")
            return []
        
        # Get all records as a list of dictionaries (header row becomes keys)
        try:
            all_records = worksheet.get_all_records()
        except:
            print("An error occurred! Could not fetch records from the Google Sheet. Please check your worksheet.")
            return []
            
        investors_data = []
        for row in all_records:
            # Adjust these keys to match your Google Sheet column names EXACTLY
            investor = {
                'id': row.get('id'),
                'name': row.get('name'),
                'location': row.get('location', ''),
                'industries': row.get('industries', '').split(', '),
                'investment_range': row.get('investment_range', '').split(','),
                'risk_tolerance': row.get('risk_tolerance', '').lower(),
                'contact': row.get('contact', ''),
                'description': row.get('description', ''),
                'stages': row.get('stages', '')
            }
            if investor['name']:
                investors_data.append(investor)
                
        return investors_data
        
    except FileNotFoundError:
        print(f"Error: Credentials file not found at {CREDENTIALS_FILE}")
        return []
    except Exception as e:
        print(f"An error occurred while fetching data from Google Sheets: {e}")
        return []



INVESTORS = get_investors_from_sheet()

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
    if founder_profile.get('stages') in investor['stages']:
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
        "version": "3.0.0"
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
        required_fields = ['industry', 'stages', 'risk_tolerance', 'investment_range']
        missing_fields = [field for field in required_fields if not founder_profile.get(field)]

        if missing_fields:
            return jsonify({
                "success": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }), 400

        # Create a cache key from the founder profile Ensure consistent ordering of keys for consistent hashing.
        cache_key_data = {k: founder_profile.get(k) for k in sorted(founder_profile.keys())}
        cache_key = f"match:{json.dumps(cache_key_data, sort_keys=True)}"

        #Try to retrieve from cache
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

        #If not in cache, calculate matches
        print(f"Cache MISS for key: {cache_key}. Calculating matches...")
        matches = []
        for investor in INVESTORS:
            match_result = calculate_match_score(founder_profile, investor)
            if match_result["score"] > 0:
                matches.append(match_result)

        matches.sort(key=lambda x: x["score"], reverse=True)
        top_matches = matches[:3]

        response_data = {
            "success": True,
            "founder_profile": founder_profile,
            "matches": top_matches,
            "total_matches": len(matches),
        }

        #Store in cache
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
        gemini_response.raise_for_status()

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
    cache_key = "investor_matches_overview"

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
        messages_cursor = messages_collection.find().sort("timestamp", 1)

        messages_list = []
        for msg_doc in messages_cursor:
            msg_doc['_id'] = str(msg_doc['_id'])
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