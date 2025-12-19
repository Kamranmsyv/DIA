# DIA - Digital Investment Assistant

A fintech mobile application that helps users invest spare change through automated round-ups. Built with React Native (Expo) for the mobile frontend and Python Flask for the backend API.

## Features

- **Round-Up Investments**: Automatically round up transactions and invest the difference
- **Portfolio Tracking**: Monitor your investments in real-time
- **Fund Discovery**: Browse and invest in various investment funds
- **AI Assistant**: Get personalized investment advice
- **Leaderboards**: Compare your progress with other investors
- **Secure Authentication**: OTP-based user verification

## Tech Stack

### Frontend
- React Native with Expo
- React Navigation
- Context API for state management

### Backend
- Python Flask REST API
- Docker support
- JWT Authentication

## Project Structure

```
DIA/
├── dia_frontend/          # React Native mobile app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # App screens
│   │   ├── services/      # API services
│   │   ├── context/       # React Context providers
│   │   └── theme/         # Colors and typography
│   └── assets/            # Images and icons
│
└── dia_backend/           # Flask API server
    ├── app.py             # Main application
    ├── requirements.txt   # Python dependencies
    ├── Dockerfile         # Docker configuration
    └── docker-compose.yml # Docker Compose setup
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Expo CLI
- Docker (optional)

### Frontend Setup

```bash
cd dia_frontend
npm install
npx expo start
```

### Backend Setup

```bash
cd dia_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Using Docker

```bash
cd dia_backend
docker-compose up --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/verify-otp` | OTP verification |
| GET | `/api/funds` | List available funds |
| GET | `/api/funds/recommend` | Get fund recommendations |
| POST | `/api/transactions/roundup` | Process round-up transaction |
| GET | `/api/portfolio` | Get user portfolio |
| GET | `/api/leaderboard` | Get investment leaderboard |

## Screenshots

*Coming soon*

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact

- GitHub: [@Kamranmsyv](https://github.com/Kamranmsyv)
