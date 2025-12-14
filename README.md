# 🏢 JustList - Universal Facility Finder

A powerful, full-stack web application for finding any type of facilities worldwide using Google Places API with comprehensive data enrichment, search history management, and leads management system.

**🌐 Live Demo**: https://techyz-software-solutions-pvt-ltd.github.io/justlist/  
**📁 Repository**: https://github.com/TechYZ-Software-Solutions-Pvt-Ltd/justlist  
**📚 Documentation**: See `DEVELOPMENT_WORKFLOW.md` for development guide

## ✅ **Latest Updates (v4.0 - October 2025)**

### **🔧 Recent Fixes:**
- ✅ **CI/CD Pipeline Fixed**: All tests passing, automated deployment working
- ✅ **ES Module Issues Resolved**: Jest configuration optimized for fast testing
- ✅ **Professional Development Workflow**: Multi-environment setup (demo, production, main)
- ✅ **Docker Support**: Containerized development and production environments
- ✅ **Code Cleanup**: Removed redundant files and optimized project structure

### **✨ New Features:**
- ✅ **Leads Management System**: Zoho Books-style CRM functionality
- ✅ **Professional UI**: Complete dashboard redesign with sidebar navigation
- ✅ **Multi-Environment Support**: Demo, Production, and Main branch workflows
- ✅ **Docker Integration**: Consistent development environments
- ✅ **Advanced Search**: 180+ facility types across 29 categories
- ✅ **User Authentication**: Secure registration and login system

### **🚀 Deployment:**
- ✅ **GitHub Pages**: Free frontend hosting
- ✅ **Render Backend**: Free API hosting
- ✅ **Docker Support**: Containerized deployment
- ✅ **CI/CD Pipeline**: Automated testing and deployment
- ✅ **Total Cost**: $0/month

## ✨ Features

### 🔍 **Advanced Search Capabilities**
- **Google Places API Integration** - Find facilities worldwide
- **180+ Facility Types** - Comprehensive taxonomy covering:
  - Fitness & Sports (gyms, studios, sports facilities)
  - Healthcare (hospitals, clinics, pharmacies)
  - Education (schools, universities, libraries)
  - Retail (stores, malls, markets)
  - Hospitality (hotels, restaurants, cafes)
  - Finance (banks, ATMs, insurance)
  - Professional Services (legal, consulting, real estate)
  - Entertainment (theaters, museums, parks)
  - And 21 more categories!
- **Smart Location Selection** - Country → State → City filtering
- **Real-time Results** - Instant search with loading indicators
- **Customizable Display** - Choose which facility details to show

### 📊 **Search History Management**
- **Up to 30 Recent Searches** - Automatic history tracking
- **View Previous Results** - Click any history item to see results
- **Delete Entries** - Remove unwanted search records
- **Pagination** - Easy navigation through history
- **User-Specific** - Each user's history is private

### 🔐 **User Authentication**
- **Secure Registration** - Email validation and password strength checks
- **Encrypted Passwords** - bcrypt-sha256 hashing
- **Session Management** - Persistent login state
- **Logout Redirect** - Automatic redirect to login page
- **User Profiles** - Personalized experience

### 🎛️ **Settings & Customization**

#### **Data Sources Tab** (Logged-in users only)
Manage API keys for:
- Google Places API
- Foursquare Places API
- Yelp Fusion API
- OpenStreetMap Overpass API
- Facebook Graph API
- Instagram Basic Display API

#### **Listing Tab**
Customize displayed facility information:
- Name, Address, Phone Number
- Website, Rating, Reviews
- Opening Hours, Price Level
- Photos, Types, and more

#### **Help Tab**
Complete setup guides for all 6 data sources with step-by-step instructions.

### ⚖️ **Legal Compliance**
- **Publicly Available Data Only** - No unauthorized scraping
- **Respects robots.txt** - Web scraping follows website policies
- **Rate Limiting** - Respectful API usage
- **Data Attribution** - Proper source credits
- **MIT License** - Clear legal framework

## 🚀 Quick Start

### **Option 1: Use Live App** (Recommended)

Simply visit: https://techyz-software-solutions-pvt-ltd.github.io/justlist/

1. Register a new account
2. Login with your credentials
3. Start searching for facilities!
4. Use the "Add to Leads" feature to manage your prospects

### **Option 2: Local Development**

#### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker (optional, for containerized development)

#### Quick Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/TechYZ-Software-Solutions-Pvt-Ltd/justlist.git
   cd JustList-Professional
   ```

2. **Choose your environment:**
   
   **Demo Environment (Recommended for development):**
   ```bash
   # Windows
   .\scripts\dev-demo.bat
   
   # Or manually:
   python init_database.py
   python start_backend.py
   cd frontend && npm install && npm start
   ```

   **Production Environment:**
   ```bash
   # Windows
   .\scripts\dev-production.bat
   ```

   **Docker Environment:**
   ```bash
   # Demo with Docker
   .\scripts\docker-demo.bat
   
   # Production with Docker
   .\scripts\docker-production.bat
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

See `DEVELOPMENT_WORKFLOW.md` for detailed instructions.

## 🔧 Configuration

### Google Places API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Places API"
4. Create credentials → API Key
5. **Important**: Enable billing (required for Places API)
6. Copy your API key
7. In the app: Settings → Data Sources → Paste your key

For detailed guides for all 6 APIs, see Settings → Help in the app.

## 📁 Project Structure

```
JustList-Professional/
├── frontend/                    # React frontend
│   ├── public/
│   │   ├── index.html          # Main HTML file
│   │   └── 404.html            # GitHub Pages redirect
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── forms/          # Generic form components
│   │   │   ├── layout/         # Layout components (sidebar, header)
│   │   │   ├── ui/             # UI components (loading, error states)
│   │   │   ├── Header.tsx      # App header with settings
│   │   │   ├── SearchForm.tsx  # Main search form
│   │   │   └── ResultsDisplay.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── MainPage.tsx    # Home page
│   │   │   ├── LeadsPage.tsx   # Leads management
│   │   │   ├── LoginPage.tsx   # Authentication
│   │   │   └── RegisterPage.tsx
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.tsx
│   │   ├── services/           # API services
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript type definitions
│   │   └── data/               # Static data (taxonomy, fields)
│   ├── __tests__/              # Test files
│   └── package.json
├── src/app/                    # FastAPI backend
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication
│   │   ├── facilities_simple.py # Facility search
│   │   └── leads.py           # Leads management
│   ├── database/               # Database layer
│   │   ├── connection.py
│   │   └── models.py          # SQLAlchemy models
│   ├── services/               # Business logic
│   │   └── places_service.py  # Google Places integration
│   └── utils/                  # Utilities
├── configs/                    # Environment configurations
│   ├── demo.env               # Demo environment
│   ├── production.env         # Production environment
│   └── local.env              # Local development
├── docker/                     # Docker configurations
│   ├── Dockerfile.backend     # Backend container
│   └── Dockerfile.frontend    # Frontend container
├── scripts/                    # Helper scripts
│   ├── dev-demo.bat           # Start demo environment
│   ├── dev-production.bat     # Start production environment
│   ├── docker-demo.bat        # Docker demo setup
│   └── docker-production.bat  # Docker production setup
├── .github/workflows/          # CI/CD pipeline
│   └── ci-cd.yml              # GitHub Actions
├── init_database.py            # Database initialization
├── start_backend.py            # Backend startup script
├── requirements.txt            # Python dependencies
├── docker-compose.demo.yml     # Demo Docker setup
├── docker-compose.production.yml # Production Docker setup
├── DEVELOPMENT_WORKFLOW.md     # Development guide
├── CHANGELOG.md                # Version history
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type safety and better DX
- **Material-UI (MUI) v5** - Professional component library
- **React Router DOM v6** - Client-side routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Country-State-City** - Location data

### Backend
- **FastAPI** - High-performance web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database
- **Pydantic** - Data validation
- **bcrypt-sha256** - Password hashing
- **python-jose** - JWT tokens

### Deployment
- **GitHub Pages** - Frontend hosting (free)
- **Render** - Backend hosting (free tier)
- **GitHub Actions** - CI/CD ready

### Data Sources (Optional)
- **Google Places API** - Primary data source
- **Foursquare Places API** - Additional venue data
- **Yelp Fusion API** - Business reviews and ratings
- **OpenStreetMap** - Open-source mapping data
- **Facebook Graph API** - Social media integration
- **Instagram Basic Display API** - Photo integration

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Facilities
- `POST /facilities/search` - Search facilities (requires Google API key)
- `GET /facilities/history` - Get user's search history
- `GET /facilities/history/{id}/facilities` - Get stored results for a search
- `DELETE /facilities/history/{id}` - Delete a search history entry

### Leads Management
- `GET /leads/` - Get all leads with filtering and pagination
- `POST /leads/` - Create a new lead
- `GET /leads/{lead_id}` - Get specific lead details
- `PUT /leads/{lead_id}` - Update lead information
- `DELETE /leads/{lead_id}` - Delete a lead
- `GET /leads/stats` - Get leads statistics
- `POST /leads/{lead_id}/activities` - Add activity to lead
- `GET /leads/{lead_id}/activities` - Get lead activities
- `POST /leads/{lead_id}/reminders` - Create reminder for lead
- `GET /leads/reminders/upcoming` - Get upcoming reminders

Full API documentation available at: http://localhost:8000/docs (when running locally)

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Encryption** - bcrypt-sha256 hashing (up to 72 chars)
- **User Isolation** - Each user's data is private
- **CORS Protection** - Configured for production origins
- **Input Validation** - Comprehensive validation on frontend and backend
- **SQL Injection Prevention** - SQLAlchemy ORM protection
- **Session Management** - Secure session handling

## 🎯 Deployment

### **Automated CI/CD Pipeline**

The project uses GitHub Actions for automated deployment:

- **Main Branch**: Deploys to GitHub Pages automatically
- **Production Branch**: Deploys to production environment
- **Demo Branch**: Deploys to demo environment

### **Manual Deployment**

#### **Local Development:**
```bash
# Demo environment
.\scripts\dev-demo.bat

# Production environment  
.\scripts\dev-production.bat
```

#### **Docker Deployment:**
```bash
# Demo with Docker
.\scripts\docker-demo.bat

# Production with Docker
.\scripts\docker-production.bat
```

### **Environment Configuration**

- **Demo**: `configs/demo.env` - Development and testing
- **Production**: `configs/production.env` - Production deployment
- **Local**: `configs/local.env` - Local development

See `DEVELOPMENT_WORKFLOW.md` for complete deployment instructions.

## 🧪 Testing

```bash
# Backend tests
python -m pytest tests/

# Frontend tests (fast, optimized)
cd frontend
npm test -- --watchAll=false --passWithNoTests

# Type checking
npm run type-check

# Linting
npm run lint

# CI/CD Pipeline
# Tests run automatically on push to any branch
# Check GitHub Actions for test results
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Key Points:**
- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ✅ Only uses publicly available data
- ✅ Respects all data source terms of service

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- **Issues**: Create an issue on [GitHub](https://github.com/TechYZ-Software-Solutions-Pvt-Ltd/justlist/issues)
- **Documentation**: Check `DEPLOYMENT_COMPLETE.md` and `TROUBLESHOOTING.md`
- **API Docs**: Visit `/docs` endpoint when running locally

## 🎉 Acknowledgments

- **Google Places API** - Primary facility data source
- **Material-UI** - Beautiful React components
- **FastAPI** - Modern Python web framework
- **React Community** - Excellent ecosystem and tools
- **Open Source Community** - For all the amazing libraries

## 📈 Roadmap

### ✅ Completed Features:
- [x] **Leads Management System** - Zoho Books-style CRM functionality
- [x] **Professional UI** - Complete dashboard redesign
- [x] **Multi-Environment Support** - Demo, Production, Main workflows
- [x] **Docker Integration** - Containerized development
- [x] **CI/CD Pipeline** - Automated testing and deployment
- [x] **Advanced Search** - 180+ facility types
- [x] **User Authentication** - Secure registration and login

### 🚧 Planned Features:
- [ ] **Map Integration** - Interactive maps for search results
- [ ] **Advanced Analytics** - Lead conversion tracking and reporting
- [ ] **Email Integration** - Automated follow-up emails
- [ ] **Mobile App** - React Native mobile application
- [ ] **Multi-language Support** - Internationalization
- [ ] **Dark Mode Theme** - User preference themes
- [ ] **Export Functionality** - CSV/PDF export for leads
- [ ] **Social Sharing** - Share facilities and leads
- [ ] **API Rate Limiting** - Advanced API management
- [ ] **Webhook Support** - Real-time notifications

## 🌟 Star History

If you find this project useful, please consider giving it a star on GitHub! ⭐

---

**Built with ❤️ by TechYZ Software Solutions Pvt Ltd**

**Live App**: https://techyz-software-solutions-pvt-ltd.github.io/justlist/

**Version**: 4.0.0 | **Last Updated**: October 23, 2025 | **Status**: ✅ Production Ready