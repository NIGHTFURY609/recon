from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend-backend communication

# Hard-coded investor profiles
INVESTORS = [
    {
        "id": 1,
        "name": "TechVentures Capital",
        "industries": ["fintech", "saas", "ai"],
        "stages": ["seed", "series-a"],
        "risk_tolerance": "high",
        "investment_range": [100000, 5000000],
        "description": "Early-stage tech investor focused on disruptive technologies",
        "contact": "partners@techventures.com",
        "location": "San Francisco, CA"
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
        "version": "1.0.0"
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
    Find investor matches for a founder profile
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
        
        # Calculate matches for all investors
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
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

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

@app.route('/api/stats')
def get_platform_stats():
    """Get platform statistics"""
    # Calculate some basic stats from our investor data
    total_investors = len(INVESTORS)
    industries_covered = len(set(industry for investor in INVESTORS for industry in investor['industries']))
    avg_investment_min = sum(inv['investment_range'][0] for inv in INVESTORS) // total_investors
    avg_investment_max = sum(inv['investment_range'][1] for inv in INVESTORS) // total_investors
    
    return jsonify({
        "success": True,
        "stats": {
            "total_investors": total_investors,
            "industries_covered": industries_covered,
            "average_min_investment": avg_investment_min,
            "average_max_investment": avg_investment_max,
            "risk_tolerance_distribution": {
                "high": len([inv for inv in INVESTORS if inv['risk_tolerance'] == 'high']),
                "medium": len([inv for inv in INVESTORS if inv['risk_tolerance'] == 'medium']),
                "low": len([inv for inv in INVESTORS if inv['risk_tolerance'] == 'low'])
            }
        }
    })

if __name__ == '__main__':
    print("🚀 Starting Startup Investor Matching Platform API...")
    print("📊 Dashboard: http://localhost:5000")
    print("🔍 API Endpoints:")
    print("   GET  /api/investors - List all investors")
    print("   POST /api/match - Find investor matches")
    print("   GET  /api/investors/<id> - Get investor details")
    print("   GET  /api/industries - List industries")
    print("   GET  /api/funding-stages - List funding stages")
    print("   GET  /api/stats - Platform statistics")
    
    app.run(debug=True, host='0.0.0.0', port=5000)