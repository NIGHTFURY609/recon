# Startup Investor Matching Platform

A full-stack web application that matches startup founders with potential investors based on industry, funding stage, risk tolerance, and investment amount.

## 🏗️ Architecture

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS Grid/Flexbox
- **Vanilla JavaScript** - Interactive functionality
- **Responsive Design** - Mobile-first approach

### Backend
- **Python Flask** - RESTful API
- **Flask-CORS** - Cross-origin resource sharing
- **Redis-Caching** - For fast data fetching
- **NoSQL MonogoDB** - For fast and easy data storage
- **Google Sheets** - To store scraped investor data
- **GEMINI** - For search results


## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- pip (Python package manager)
- Modern web browser

### Installation

1. **Clone/Download the files**
   ```bash
   mkdir recon
   cd recon
   ```

2. **Save the files**
   - Save `app.py` (Flask backend)
   - Save `requirements.txt`
   - Save `index.html` (Frontend)

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask backend**
   ```bash
   python app.py
   ```
   The API will be available at `http://localhost:5000`

5. **Open the frontend**
   - Open `index.html` in your web browser
   - Or serve it via a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Then visit http://localhost:8080
   ```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/investors` | List all investors |
| POST | `/api/match` | Find investor matches |
| GET | `/api/investors/<id>` | Get investor details |
| GET | `/api/industries` | List available industries |
| GET | `/api/funding-stages` | List funding stages |
| GET | `/api/stats` | Platform statistics |

### Example API Usage

**Find Matches:**
```bash
curl -X POST http://localhost:5000/api/match \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "fintech",
    "funding_stage": "seed",
    "risk_tolerance": "high",
    "investment_amount": 500000,
    "company_name": "MyStartup"
  }'
```

## 🧮 Matching Algorithm

The scoring system awards points based on alignment:

- **+3 points** - Industry match
- **+2 points** - Funding stage overlap
- **+1 point** - Risk tolerance alignment
- **+1 point** - Investment amount within range

**Maximum Score: 7 points**


## 🎨 Frontend Features

- **Multi-step wizard interface**
- **Real-time form validation**
- **Loading states and animations**
- **Responsive design**
- **Professional UI matching the reference**
- **Interactive match results**

## 🔐 Security Considerations

For production deployment:

1. **Input validation** - Add server-side validation
2. **Rate limiting** - Prevent API abuse
3. **HTTPS** - Secure data transmission
5. **Database** - Replace in-memory data with persistent storage



### Advanced Features
- **Real-time matching** with WebSocket connections
- **Machine learning** for improved matching accuracy
- **Messaging system** between founders and investors
- **Analytics dashboard** for platform insights


## 🚢 Deployment Options

### Local Development
- Use the setup instructions above


### Docker Setup
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

## 📝 Next Steps
1. **Implement user authentication** (JWT tokens)
2. **Add email notifications** for matches
3. **Add investor application workflow**

## 🤝 Contributing

This is a MVP implementation.
