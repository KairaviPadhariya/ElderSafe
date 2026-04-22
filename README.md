# ElderSafe 

A comprehensive web-based platform designed to monitor senior citizens' health data, predict potential health risks, and facilitate secure communication of emergency alerts. The solution leverages modern web technologies, machine learning, and established DevOps practices.

## 🚀 Key Features

*   **Real-time Health Monitoring:** Track vital health statistics and daily activity logs.
*   **Machine Learning Risk Prediction:** Predict potential health risks and deterioration using a dedicated machine learning pipeline built with Scikit-Learn utilizing historical dataset insights.
*   **Secure Authentication:** JWT-based robust authentication utilizing bcrypt and cryptography ensures personal data is strictly protected.
*   **Modern Interactive Dashboard:** A highly responsive React + Vite frontend built with TailwindCSS for displaying health trends, predictions, and profile management.
*   **Scalable Architecture:** A fully containerized microservice architecture orchestrated using Docker and Docker Compose.
*   **Automated CI/CD Pipeline:** Fully integrated Jenkins pipeline for seamless and automated testing, building, and deployment of both frontend and backend modules.

## 🛠️ Technology Stack

**Frontend**
*   React 18 + Vite
*   TypeScript
*   TailwindCSS + Lucide React (Icons)
*   React Router DOM

**Backend**
*   FastAPI (Python)
*   Motor (Async MongoDB driver)
*   Passlib, Python-Jose (Security & JWT)

**Data Science & Machine Learning**
*   Scikit-Learn, Pandas, NumPy
*   Matplotlib, Seaborn

**DevOps & Infrastructure**
*   Docker & Docker Compose (Containerization)
*   Jenkins (CI/CD Pipeline)
*   AWS EC2 (Cloud Deployment)

## 📁 Project Structure

```
ElderSafe/
├── app/                  # FastAPI Backend source code
├── src/                  # React Frontend source code
├── docs/                 # Documentation and design references
├── Jenkinsfile           # Jenkins CI/CD pipeline configuration
├── Dockerfile.frontend   # Container specs for the React frontend
├── Dockerfile.backend    # Container specs for the FastAPI backend
├── docker-compose.yml    # Multi-container orchestration
├── requirements.txt      # Python backend dependencies
├── requirements-ml.txt   # Python ML pipeline dependencies
└── package.json          # Node.js frontend dependencies
```

## ⚙️ Getting Started

### Prerequisites

*   **Node.js** (v18+)
*   **Python** (v3.10+)
*   **MongoDB** Instance (Local or Atlas)
*   **Docker** & **Docker Compose** (for containerized setup)

### 1. Environment Configuration

Create a `.env` file in the root directory based on `.env.example` (or configure the following variables):

```env
# Backend & MongoDB
MONGO_URI=mongodb://localhost:27017
DATABASE_NAME=eldersafe
SECRET_KEY=your_super_secret_jwt_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 2. Running Locally (Development Mode)

**Backend Setup:**
```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-ml.txt

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend Setup:**
Open a new terminal window:
```bash
# Install NPM packages
npm install

# Start the Vite development server
npm run dev
```

### 3. Cloud Deployment (AWS EC2)

The application is deployed on an AWS EC2 instance. Ensure Docker is installed on your EC2 instance and execute:

```bash
# Build and spin up the entire stack
docker-compose up --build -d
```

*   The **Frontend** will be accessible publicly via the EC2 instance's IP address on port `5173` (e.g., `http://<EC2_PUBLIC_IP>:5173`).
*   The **Backend Options/API Docs** will be available at `http://<EC2_PUBLIC_IP>:8000/docs`.

## 🤖 CI/CD Pipeline

The project includes a `Jenkinsfile` for continuous integration and continuous deployment:
*   Linting and typechecking for the frontend (`npm run lint`, `npm run typecheck`).
*   Building Docker images for both backend and frontend layers.
*   Deploying onto target environments safely.

## 📄 License & Acknowledgements

This project was built for academic/university implementation purposes (Sem-4 SGP). All rights reserved to the creators.
