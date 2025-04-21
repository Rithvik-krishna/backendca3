require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const port = 5000;

app.use(express.json());
app.use(cookieParser());

const ACCESS_TOKEN_SECRET = process.env.require.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.require.REFRESH_TOKEN_SECRET;

let refreshTokens = [];

const user = {
      username: 'admin',
        password: 'password123'
};

const generateAccessToken = (user) => {
      return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '2m' });
};

const generateRefreshToken = (user) => {
      const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
        refreshTokens.push(refreshToken);
          return refreshToken;
};

app.post('/login', (req, res) => {
      const { username, password } = req.body;
        if (username === user.username && password === user.password) {
                const userPayload = { username };
                    const accessToken = generateAccessToken(userPayload);
                        const refreshToken = generateRefreshToken(userPayload);
                            res.json({ accessToken, refreshToken });
        } else {
                res.status(401).json({ message: 'Invalid credentials' });
        }
    });

    app.post('/token', (req, res) => {
          const { refreshToken } = req.body;
            if (!refreshToken || !refreshTokens.includes(refreshToken)) {
                    return res.status(403).json({ error: 'Forbidden' });
            }

              jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
                    if (err) return res.status(403).json({ error: 'Forbidden' });
                        const newAccessToken = generateAccessToken({ username: user.username });
                            res.json({ accessToken: newAccessToken });
              });
            });

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.status(403).json({ error: 'Forbidden' });
  
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };
  
  app.get('/profile', authenticateToken, (req, res) => {
    res.json({ message: 'User profile loaded successfully.' });
  });
  
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });